/**
 * Design tokens — single source of truth, mirrored from docs/brand/brand-guidelines.md.
 * Change values there first, then here.
 *
 * Light and dark: `colors`, `chart` and `shadow` read the active scheme every time you access a token, so
 * - in render, `colors.ink` is always current;
 * - module-level styles must be built with `themed(() => StyleSheet.create({...}))`, which builds once per scheme.
 * The scheme comes from the phone (System) unless the player picks Light or Dark (src/state/appearance.tsx).
 */
import { Appearance } from 'react-native';

export type Scheme = 'light' | 'dark';

const light = {
  // Brand palette (2026-11-26 refresh: calmer, warmer; see docs/brand/brand-guidelines.md)
  fairway: '#173D32', // forest — brand anchor, primary actions, active tab, titles
  cream: '#FFFFFF', // page background (and text on fairway fills); white since 2026-11-26
  gold: '#B39556', // muted gold — small accents, earned tiers, the + ring
  slate: '#526B78',
  sage: '#829977',

  // Supporting neutrals
  paper: '#F4EFE6', // scorecard paper, inset fills (score boxes, segmented track, icon buttons)
  ink: '#343A34', // charcoal — primary text
  inkMuted: '#6A6E64',
  rule: '#E2DACB', // warm line — table rules, dividers
  pennant: '#D9622B', // artwork only — never UI

  // Derived UI tones
  fairwayDeep: '#0F2A22', // always-dark surfaces (reveal, tooltips, scrims over art)
  creamLight: '#FFFFFF', // raised surface (grouped lists, stat strips, cards): white, set apart by its shadow
  goldSoft: '#E9DCBE',
  white: '#FFFFFF',
  success: '#4F7A3A',
  danger: '#9B2C1F',
  hairline: '#EEE8DD',
  /** Text and icons on always-dark surfaces (fairwayDeep, scrims over art). The same in both schemes. */
  onDark: '#F6EFE3',
  onDarkMuted: 'rgba(246,239,227,0.72)',
  /** Secondary text and rules on a fairway fill (feature cards, the active-round banner). */
  onFillMuted: 'rgba(246,239,227,0.72)',
  onFillRule: 'rgba(246,239,227,0.25)',
  /** Round buttons floating on paintings. */
  artButton: 'rgba(252,248,241,0.92)',
  /** The selected segment in a segmented control (lighter than its track in both schemes). */
  segment: '#FFFFFF',
  /** The bottom tab bar: white in light (set apart by its shadow), a raised surface in dark. */
  tabBar: '#FFFFFF',
  /** Soft green fill for round icon buttons (back, close, header actions). */
  tint: '#E6EEE7',
};

/**
 * Dark: a night-course palette. Fairway and cream swap jobs: titles, active states and primary buttons go pale
 * green with dark text on them, so every "cream on fairway" pairing keeps working.
 */
const dark: typeof light = {
  fairway: '#D3E4CC',
  cream: '#121915',
  gold: '#CDB073',
  slate: '#8FA9B6',
  sage: '#9DB391',
  paper: '#25302A',
  ink: '#ECE6DA',
  inkMuted: '#A3A89C',
  rule: '#3A453E',
  pennant: '#D9622B',
  fairwayDeep: '#0B1612',
  creamLight: '#1B241F',
  goldSoft: '#3F3726',
  white: '#FFFFFF',
  success: '#8DBB74',
  danger: '#E8826F',
  hairline: '#2A342E',
  onDark: '#F6EFE3',
  onDarkMuted: 'rgba(246,239,227,0.72)',
  onFillMuted: 'rgba(18,25,21,0.66)',
  onFillRule: 'rgba(18,25,21,0.2)',
  artButton: 'rgba(18,25,21,0.82)',
  segment: '#3A4740',
  tabBar: '#1B241F',
  tint: '#26352D',
};

/**
 * Chart tokens. Scoring is a diverging scale around par: gold arm (under par) · warm gray midpoint · slate arm (over par).
 * Each arm gains contrast away from par (darker on light, lighter on dark). Series text always uses ink tokens.
 */
const chartLight = {
  eagle: '#6E4E10',
  birdie: '#B48A2E',
  par: '#ACA597',
  bogey: '#5F86A6',
  double: '#2F4D63',
  line: light.fairway,
  area: 'rgba(23,61,50,0.10)',
  reference: light.gold,
  grid: '#E8DFCF',
  track: '#ECE3D2',
  muted: '#B9AE95',
};
const chartDark: typeof chartLight = {
  eagle: '#E6C77F',
  birdie: '#B48A2E',
  par: '#6E695E',
  bogey: '#5F86A6',
  double: '#A6C4DA',
  line: dark.fairway,
  area: 'rgba(211,228,204,0.12)',
  reference: dark.gold,
  grid: '#2A342E',
  track: '#25302A',
  muted: '#5C5749',
};

const shadowFor = (s: Scheme) => ({
  /** Raised surfaces: soft, wide and warm (no hard edge). */
  card: {
    shadowColor: s === 'dark' ? '#000000' : '#6B5530',
    shadowOpacity: s === 'dark' ? 0.32 : 0.11,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  /** Small floating controls (selected segment, round buttons on art). */
  control: {
    shadowColor: s === 'dark' ? '#000000' : '#6B5530',
    shadowOpacity: s === 'dark' ? 0.4 : 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
const shadows = { light: shadowFor('light'), dark: shadowFor('dark') };

// ── Active scheme ─────────────────────────────────────────────────────────

let active: Scheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
const listeners = new Set<() => void>();

export const currentScheme = (): Scheme => active;

/** Switch every token to `scheme` and notify subscribers (the appearance provider re-renders the app). */
export function setScheme(scheme: Scheme) {
  if (scheme === active) return;
  active = scheme;
  listeners.forEach((l) => l());
}

export function subscribeScheme(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** An object whose keys read from `pick(active)` on every access (spread-safe: keys are enumerable getters). */
function live<T extends object>(pick: (s: Scheme) => T): T {
  const out = {} as T;
  for (const key of Object.keys(pick('light')) as (keyof T)[]) {
    Object.defineProperty(out, key, { enumerable: true, get: () => pick(active)[key] });
  }
  return out;
}

export const colors: Readonly<typeof light> = live((s) => (s === 'dark' ? dark : light));
export const chart: Readonly<typeof chartLight> = live((s) => (s === 'dark' ? chartDark : chartLight));
export const shadow = live((s) => shadows[s]);

/** Raw palettes, for the few places that need a specific scheme (e.g. web page background). */
export const palettes = { light, dark } as const;

/**
 * Module-level styles that follow the scheme: `const styles = themed(() => StyleSheet.create({...}))`.
 * Built lazily, once per scheme; `styles.x` returns the active scheme's style.
 */
export function themed<T extends object>(make: () => T): T {
  const cache: Partial<Record<Scheme, T>> = {};
  const current = () => (cache[active] ??= make());
  return new Proxy({} as T, {
    get: (_t, key) => current()[key as keyof T],
    has: (_t, key) => key in current(),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_t, key) => {
      const d = Reflect.getOwnPropertyDescriptor(current(), key);
      return d ? { ...d, configurable: true } : undefined;
    },
  });
}

/** Avatar backgrounds for players without a photo (picked by id). Initials are white in both schemes. */
export const avatarTones = ['#486E8B', '#748056', '#8A6A2C', '#5B4B6B', '#2E5A47'] as const;

export const fonts = {
  display: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const type = {
  displayXL: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40 },
  displayL: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  displayM: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  displayS: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bodySemibold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  stat: { fontFamily: fonts.bodySemibold, fontSize: 26, lineHeight: 30, fontVariant: ['tabular-nums' as const] },
  scoreEntry: { fontFamily: fonts.bodyBold, fontSize: 56, lineHeight: 64, fontVariant: ['tabular-nums' as const] },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;
