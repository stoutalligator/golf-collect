/**
 * Design tokens — single source of truth, mirrored from docs/brand/brand-guidelines.md.
 * Change values there first, then here.
 */

export const colors = {
  // Brand palette (sampled from the Greens Keeper board)
  fairway: '#1F3D2F',
  cream: '#F2E6CF',
  gold: '#BB8B2B',
  slate: '#486E8B',
  sage: '#748056',

  // Supporting neutrals
  paper: '#EFE2C8',
  ink: '#22281F',
  inkMuted: '#5E6459',
  rule: '#D9CBB0',
  pennant: '#D9622B', // artwork only — never UI

  // Derived UI tones
  fairwayDeep: '#15291F',
  creamLight: '#F8F0E1',
  goldSoft: '#E6D2A3',
  white: '#FFFFFF',
} as const;

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

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: '#1F3D2F',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;
