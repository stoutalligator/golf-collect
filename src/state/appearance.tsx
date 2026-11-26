/**
 * Light / dark appearance. The player picks System (follow the phone), Light or Dark in Settings; the choice is
 * stored on this device. The resolved scheme drives the theme tokens (src/theme `setScheme`), and this provider
 * re-renders the app when it changes so every screen picks up the new palette.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Appearance, Platform } from 'react-native';

import { colors, currentScheme, setScheme, subscribeScheme, type Scheme } from '@/theme';

export type AppearancePref = 'system' | 'light' | 'dark';

const KEY = 'gk.appearance';

interface AppearanceState {
  pref: AppearancePref;
  scheme: Scheme;
  setPref(pref: AppearancePref): void;
}

const Ctx = createContext<AppearanceState | null>(null);

/** What the phone itself is set to (ignoring our override). */
const systemScheme = (): Scheme => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<AppearancePref | null>(null);
  const scheme = useSyncExternalStore(subscribeScheme, currentScheme, currentScheme);

  // Load the saved choice before the first screen renders (the splash is still up), so there's no flash.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((v) => (v === 'light' || v === 'dark' ? v : 'system'))
      .catch(() => 'system' as const)
      .then((v) => {
        if (!alive) return;
        apply(v);
        setPrefState(v);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Follow the phone while on System (sunset switches, Control Center).
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (pref === 'system' || pref === null) setScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, [pref]);

  // Keep the native root view (behind screens, during transitions) on the page color.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.cream).catch(() => {});
  }, [scheme]);

  const setPref = useCallback((next: AppearancePref) => {
    setPrefState(next);
    apply(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => (pref ? { pref, scheme, setPref } : null), [pref, scheme, setPref]);
  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Point native UI (keyboard, alerts, pickers) at the same scheme, then switch the tokens. */
function apply(pref: AppearancePref) {
  if (Platform.OS !== 'web') Appearance.setColorScheme(pref === 'system' ? 'auto' : pref);
  setScheme(pref === 'system' ? systemScheme() : pref);
}

export function useAppearance(): AppearanceState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppearance must be used inside AppearanceProvider');
  return v;
}
