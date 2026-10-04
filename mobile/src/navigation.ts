import { colors, fonts } from './theme';

/** The same header on every stack: white bar, no hairline, brand-blue back arrow. */
export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
  headerTintColor: colors.primary,
  headerBackTitle: 'Back',
  contentStyle: { backgroundColor: colors.background },
} as const;
