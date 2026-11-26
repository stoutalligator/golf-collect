/**
 * Design tokens — single source of truth, mirrored from docs/brand/brand-guidelines.md.
 * Change values there first, then here.
 */

export const colors = {
  // Brand palette (2026-11-26 refresh: calmer, warmer; see docs/brand/brand-guidelines.md)
  fairway: '#173D32', // forest — brand anchor, primary actions, active tab, titles
  cream: '#F6EFE3', // page background
  gold: '#B39556', // muted gold — small accents, earned tiers, the + ring
  slate: '#526B78',
  sage: '#829977',

  // Supporting neutrals
  paper: '#F1E8D8', // scorecard paper, inset fills (score boxes, segmented track, icon buttons)
  ink: '#343A34', // charcoal — primary text
  inkMuted: '#6A6E64',
  rule: '#D6CCB9', // warm line — table rules, dividers
  pennant: '#D9622B', // artwork only — never UI

  // Derived UI tones
  fairwayDeep: '#0F2A22',
  creamLight: '#FCF8F1', // raised surface (grouped lists, stat strips, cards)
  goldSoft: '#E9DCBE',
  white: '#FFFFFF',
  success: '#4F7A3A',
  danger: '#9B2C1F',
  hairline: '#E8DFCF',
} as const;

/**
 * Chart tokens. Scoring is a diverging scale around par: gold arm (under par) · warm gray midpoint · slate arm (over par).
 * Each arm darkens away from par. Series text always uses ink tokens, never these.
 */
export const chart = {
  eagle: '#6E4E10',
  birdie: '#B48A2E',
  par: '#ACA597',
  bogey: '#5F86A6',
  double: '#2F4D63',
  line: colors.fairway,
  area: 'rgba(23,61,50,0.10)',
  reference: colors.gold,
  grid: '#E8DFCF',
  track: '#ECE3D2',
  muted: '#B9AE95',
} as const;

/** Avatar backgrounds for players without a photo (picked by id). */
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

export const shadow = {
  /** Raised surfaces: soft, wide and warm (no hard edge). */
  card: {
    shadowColor: '#6B5530',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  /** Small floating controls (selected segment, round buttons on art). */
  control: {
    shadowColor: '#6B5530',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;
