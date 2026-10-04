import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { KeyboardTypeOptions, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CONTENT_MAX_WIDTH,
  TOUCH_TARGET,
  colors,
  fonts,
  radius,
  shadow,
  spacing,
  type,
} from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color = colors.text }: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  // Decorative by default: every icon in the app sits next to text that says the same thing.
  return <Ionicons name={name} size={size} color={color} accessibilityElementsHidden importantForAccessibility="no" />;
}

/**
 * The page frame: canvas background, one centred column, optional pull-to-refresh,
 * and an optional footer pinned to the bottom (for a screen's main action).
 *
 * `safeTop` is for screens with no navigation header above them, such as tab
 * screens, which would otherwise draw under the status bar.
 */
export function Screen({
  children,
  scroll = true,
  safeTop = false,
  refreshing,
  onRefresh,
  footer,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  safeTop?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = <View style={[styles.column, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen} edges={safeTop ? ['top', 'left', 'right'] : ['left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }>
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{inner}</View>
      )}
      {footer && (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>{footer}</View>
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}

/** The large heading at the top of a tab screen, with an optional element on the right. */
export function ScreenHeader({ eyebrow, title, right }: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.fill}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text accessibilityRole="header" style={styles.display}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.heading}>
      {children}
    </Text>
  );
}

/** A section title with an optional link-style action on the right. */
export function SectionHeader({ title, action }: {
  title: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={styles.heading}>
        {title}
      </Text>
      {action && (
        <Pressable accessibilityRole="button" onPress={action.onPress} style={styles.sectionAction}>
          <Text style={styles.link}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

/** `onBrand` and `outlineOnBrand` are for buttons placed on a brand-blue background. */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'onBrand' | 'outlineOnBrand';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  busy = false,
  disabled = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  busy?: boolean;
  disabled?: boolean;
  /** Sizes to its content instead of filling the row. */
  compact?: boolean;
}) {
  const inactive = disabled || busy;
  const tone = BUTTON_TONES[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: tone.bg, borderColor: tone.border ?? tone.bg },
        pressed && !inactive && { backgroundColor: tone.pressed },
        inactive && variant === 'primary' && styles.buttonDisabled,
        inactive && variant !== 'primary' && styles.dimmed,
      ]}>
      {busy ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={20} color={tone.fg} />}
          <Text style={[styles.buttonLabel, { color: tone.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const BUTTON_TONES: Record<ButtonVariant, { bg: string; fg: string; pressed: string; border?: string }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary, pressed: colors.primaryPressed },
  secondary: { bg: colors.primarySoft, fg: colors.primary, pressed: '#D6E6F6' },
  outline: { bg: colors.card, fg: colors.text, pressed: colors.surface, border: colors.borderStrong },
  danger: { bg: colors.dangerSoft, fg: colors.danger, pressed: '#FAD9D5' },
  ghost: { bg: 'transparent', fg: colors.primary, pressed: colors.primarySoft },
  onBrand: { bg: colors.card, fg: colors.primary, pressed: colors.primarySoft },
  outlineOnBrand: { bg: 'transparent', fg: colors.onPrimary, pressed: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.7)' },
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'sentences',
  autoComplete,
  multiline = false,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  error?: string;
  /** Guidance shown under the field when there is no error. */
  hint?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: ComponentProps<typeof TextInput>['autoComplete'];
  multiline?: boolean;
  icon?: IconName;
}) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}>
        {icon && <Icon name={icon} size={20} color={colors.textMuted} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !revealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={!secureTextEntry}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          // Announce the validation message with the field rather than leaving a
          // screen-reader user to hunt for red text elsewhere on the screen.
          accessibilityHint={error ?? hint}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((r) => !r)}
            style={styles.reveal}>
            <Icon name={revealed ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!!error ? (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      ) : !!hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/**
 * One large box for a six-digit emailed code. Digits only, spaced wide so each is
 * easy to check against the email, and offered the code from the keyboard where
 * the phone supports it.
 */
export function CodeField({ value, onChangeText, error, label = 'Code from the email' }: {
  value: string;
  onChangeText: (next: string) => void;
  error?: string;
  label?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        placeholder="••••••"
        placeholderTextColor={colors.disabled}
        accessibilityLabel={label}
        accessibilityHint={error ?? 'Six digits'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.code, focused && styles.inputFocused, !!error && styles.inputError]}
      />
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      )}
    </View>
  );
}

const NOTICE_TONES = {
  error: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' as IconName },
  info: { bg: colors.primarySoft, fg: colors.primary, icon: 'information-circle' as IconName },
  success: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' as IconName },
  warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'time' as IconName },
};

/** Page-level error or status message. */
export function Notice({ message, tone = 'error' }: {
  message: string;
  tone?: keyof typeof NOTICE_TONES;
}) {
  const t = NOTICE_TONES[tone];
  return (
    <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: t.bg }]}>
      <Icon name={t.icon} size={22} color={t.fg} />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

export function Card({ children, onPress, accessibilityLabel, style }: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}>
      {children}
    </Pressable>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.body, styles.muted]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: {
  icon: IconName;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={[styles.heading, styles.center]}>{title}</Text>
      <Text style={[styles.body, styles.muted, styles.center]}>{body}</Text>
      {action && <Button label={action.label} onPress={action.onPress} compact />}
    </View>
  );
}

const AVATAR_TINTS = [
  { bg: '#E7F0FA', fg: '#0B5FA5' },
  { bg: '#FEF3DF', fg: '#8A5A00' },
  { bg: '#E5F4EB', fg: '#15703F' },
  { bg: '#F1E9FB', fg: '#6B3FA0' },
  { bg: '#FDECEA', fg: '#B42318' },
  { bg: '#E3F4F6', fg: '#0E6670' },
];

/** Initials on a tint picked from the name, so the same person always looks the same. */
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const tint = AVATAR_TINTS[hash % AVATAR_TINTS.length];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tint.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: size * 0.38, color: tint.fg }}>
        {initials || '?'}
      </Text>
    </View>
  );
}

/** A selectable pill, for filters and option groups. */
export function Chip({ label, selected, onPress, icon }: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && styles.chipPressed,
      ]}>
      {icon && <Icon name={icon} size={18} color={selected ? colors.onPrimary : colors.textMuted} />}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const BADGE_TONES = {
  neutral: { bg: colors.surface, fg: colors.textMuted },
  info: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

export type BadgeTone = keyof typeof BADGE_TONES;

/** A small status label. The text carries the meaning; colour only reinforces it. */
export function Badge({ label, tone = 'neutral', icon }: {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
}) {
  const t = BADGE_TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon && <Icon name={icon} size={14} color={t.fg} />}
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/** One line of detail with a leading icon: a date, a place, a person. */
export function DetailRow({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.detailText}>{children}</Text>
    </View>
  );
}

/** A tappable settings-style row inside a grouped list. */
export function ListRow({ icon, label, onPress, tone = 'default', last = false }: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  last?: boolean;
}) {
  const fg = tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.listRow, !last && styles.listRowDivider, pressed && styles.listRowPressed]}>
      <View style={[styles.listIcon, tone === 'danger' && { backgroundColor: colors.dangerSoft }]}>
        <Icon name={icon} size={20} color={tone === 'danger' ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.body, styles.fill, { color: fg }]}>{label}</Text>
      <Icon name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

/** Groups ListRows into one white rounded block. */
export function ListGroup({ children }: { children: ReactNode }) {
  return <View style={styles.listGroup}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  center: { textAlign: 'center' },
  column: {
    flex: 1,
    gap: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  scrollContent: { padding: spacing.md + 4, paddingBottom: spacing.xl, flexGrow: 1 },
  footer: { backgroundColor: colors.card, ...shadow.raised },
  footerInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },

  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  eyebrow: { ...type.label, color: colors.textMuted },
  display: { ...type.display, color: colors.text },
  title: { ...type.title, color: colors.text },
  heading: { ...type.heading, color: colors.text },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionAction: { minHeight: TOUCH_TARGET, justifyContent: 'center', paddingLeft: spacing.md },
  link: { ...type.bodyStrong, color: colors.primary },
  body: { ...type.body, color: colors.text },
  muted: { color: colors.textMuted },

  button: {
    minHeight: TOUCH_TARGET + 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonCompact: { alignSelf: 'flex-start', paddingHorizontal: spacing.md + 4 },
  buttonDisabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  dimmed: { opacity: 0.5 },
  buttonLabel: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, textAlign: 'center' },

  field: { gap: 6 },
  fieldLabel: { ...type.label, color: colors.text },
  inputWrap: {
    minHeight: TOUCH_TARGET + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  inputWrapMultiline: { alignItems: 'flex-start', paddingTop: spacing.sm },
  inputFocused: { borderColor: colors.primary, boxShadow: '0 0 0 3px rgba(11, 95, 165, 0.15)' },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    // A browser gives inputs an intrinsic width; without this the field refuses to
    // shrink and pushes the show-password button out of the box.
    minWidth: 0,
    alignSelf: 'stretch',
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
    ...type.body,
    color: colors.text,
    // The wrapper draws the focus ring; the browser's own outline would double it.
    outlineStyle: 'none',
  } as object,
  inputMultiline: { minHeight: TOUCH_TARGET * 2, textAlignVertical: 'top' },
  reveal: { minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  code: {
    minHeight: 68,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 32,
    letterSpacing: 12,
    color: colors.text,
    outlineStyle: 'none',
  } as object,
  fieldError: { ...type.caption, color: colors.danger },
  fieldHint: { ...type.caption, color: colors.textMuted },

  notice: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  noticeText: { ...type.body, color: colors.text, flex: 1 },

  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    gap: spacing.sm + 2,
    ...shadow.card,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },

  empty: {
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },

  chip: {
    minHeight: TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  // Selection is shown by fill, border and weight together — not colour alone.
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipPressed: { backgroundColor: colors.surface },
  chipText: { ...type.label, color: colors.text },
  chipTextSelected: { color: colors.onPrimary, fontFamily: fonts.semibold },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { ...type.small, fontFamily: fonts.semibold },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  detailText: { ...type.caption, color: colors.textMuted, flex: 1, paddingTop: 0 },

  listGroup: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  listRow: {
    minHeight: TOUCH_TARGET + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  listRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.surface },
  listRowPressed: { backgroundColor: colors.surface },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
