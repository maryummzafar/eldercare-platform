/**
 * Design tokens.
 *
 * Elders are the buying side, and the usual mobile defaults fail them: 14sp body
 * text, thin grey-on-white labels, and 32dp tap targets. Body text here starts at
 * 17-18, the smallest tap target is 48dp, and no text colour drops below 4.5:1 on
 * the surface it sits on. Prefer these over ad-hoc values in screens, so the app
 * reads as one product and those floors hold as screens get added.
 */

export const colors = {
  /** The app canvas. Cards sit on it in white. */
  background: '#F4F6F9',
  card: '#FFFFFF',
  /** Quiet fills: inputs at rest, segmented controls, skeletons. */
  surface: '#EDF1F5',
  border: '#DDE3EA',
  borderStrong: '#C3CCD6',

  // 15:1 and 6.2:1 on the canvas.
  text: '#111827',
  textMuted: '#4B5563',

  // Brand. 5.1:1 on white; white text on it clears AA.
  primary: '#0B5FA5',
  primaryPressed: '#084A82',
  primarySoft: '#E7F0FA',
  onPrimary: '#FFFFFF',

  /** The heart in the logo. Decorative only; never carries text. */
  accent: '#F5A524',
  accentSoft: '#FEF3DF',

  success: '#15703F',
  successSoft: '#E5F4EB',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  warning: '#8A5A00',
  warningSoft: '#FFF4D6',

  disabled: '#A8B1BC',
} as const;

/**
 * Inter, loaded in the root layout. Custom fonts on Android ignore fontWeight, so
 * each weight is its own family and the type ramp names them explicitly.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.6 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 34, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 26 },
  label: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  // Secondary detail only. Never instructions or errors.
  caption: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/** One soft elevation for cards, the same on iOS, Android and web. */
export const shadow = {
  card: { boxShadow: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)' },
  raised: { boxShadow: '0 -4px 16px rgba(16, 24, 40, 0.08)' },
} as const;

/**
 * Android's accessibility guidance puts the minimum touch target at 48dp.
 * Buttons and rows meet it via minHeight, not padding maths that a longer
 * translation could quietly collapse.
 */
export const TOUCH_TARGET = 48;

/**
 * Content never stretches past this. On a phone it does nothing; on a tablet or
 * the website on a laptop it keeps one readable column instead of 1400px lines.
 */
export const CONTENT_MAX_WIDTH = 600;
