/**
 * Design tokens tuned for the people who pay for this product.
 *
 * Elders are the buying side, and the usual mobile defaults fail them: 14sp body
 * text, thin grey-on-white labels, and 32dp tap targets. Everything here is sized
 * up from those defaults on purpose — body text starts at 18, the smallest tap
 * target is 48dp, and no text colour drops below a 4.5:1 contrast ratio on its
 * background. Prefer these over ad-hoc values in screens.
 */

export const colors = {
  // 7.4:1 on white — comfortably past AA for body text.
  text: '#1A1D21',
  // 4.6:1 on white. The floor for anything a user actually has to read.
  textMuted: '#565C63',
  background: '#FFFFFF',
  surface: '#F4F6F8',
  border: '#C9D0D8',

  // 5.1:1 on white, and white text on it clears AA at our sizes.
  primary: '#0B5FA5',
  primaryPressed: '#084A82',
  onPrimary: '#FFFFFF',

  danger: '#A61B1B',
  success: '#1B6B34',
  warning: '#8A5A00',

  disabled: '#9AA3AC',
} as const;

/**
 * 18 is the body floor, not the ceiling. Sizes step up rather than down so a
 * screen that needs emphasis gets bigger, never smaller.
 */
export const type = {
  title: { fontSize: 30, fontWeight: '700' as const, lineHeight: 38 },
  heading: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  body: { fontSize: 18, fontWeight: '400' as const, lineHeight: 27 },
  bodyStrong: { fontSize: 18, fontWeight: '600' as const, lineHeight: 27 },
  label: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  // Only for genuinely secondary detail. Never for instructions or errors.
  caption: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/**
 * Android's accessibility guidance puts the minimum touch target at 48dp.
 * Buttons and rows in this app meet it via minHeight, not padding maths that
 * a longer translation could quietly collapse.
 */
export const TOUCH_TARGET = 48;

/**
 * Content never stretches past this. On a phone it is wider than the screen and so
 * does nothing; on a tablet, a landscape phone, or the web preview on a laptop it
 * stops lines of text running to 1200px, which is unreadable at our 18sp body size.
 * Screens stay a single centred column rather than gaining a desktop layout.
 */
export const CONTENT_MAX_WIDTH = 560;

export const radius = {
  sm: 8,
  md: 12,
} as const;
