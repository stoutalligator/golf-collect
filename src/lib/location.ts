/**
 * Where the player is, for "courses near you". Foreground ("when in use") only, coarse accuracy, never throws:
 * every failure (no permission, no fix, simulator, web without geolocation) resolves to `null`.
 */
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { LatLng } from '@/domain/geo';

export type LocationState =
  | { status: 'loading' }
  | { status: 'ready'; here: LatLng }
  /** Permission denied (and `canAskAgain` false means only iOS Settings can turn it back on). */
  | { status: 'denied'; canAskAgain: boolean }
  /** Allowed, but no position came back (airplane mode, indoors with no signal…). */
  | { status: 'unavailable' };

async function fix(): Promise<LatLng | null> {
  // A recent cached fix is instant and plenty for "which course am I at".
  const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000, requiredAccuracy: 1000 }).catch(() => null);
  if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
  const now = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
  ]);
  return now ? { lat: now.coords.latitude, lng: now.coords.longitude } : null;
}

/**
 * The player's location. Asks for permission the first time (when `ask` is true and iOS hasn't been asked yet);
 * after a "Don't Allow" it stays quiet and reports `denied`.
 */
export function useLocation(ask = true): LocationState & { retry: () => void } {
  const [state, setState] = useState<LocationState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted && perm.canAskAgain && (ask || attempt > 0)) perm = await Location.requestForegroundPermissionsAsync();
        if (!alive) return;
        if (!perm.granted) return setState({ status: 'denied', canAskAgain: perm.canAskAgain });
        const here = await fix();
        if (alive) setState(here ? { status: 'ready', here } : { status: 'unavailable' });
      } catch {
        if (alive) setState({ status: 'unavailable' });
      }
    })();
    return () => {
      alive = false;
    };
  }, [ask, attempt]);

  return { ...state, retry: () => { setState({ status: 'loading' }); setAttempt((n) => n + 1); } };
}
