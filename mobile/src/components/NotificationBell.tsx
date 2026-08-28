import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useUnreadCount } from '../notifications/useUnreadCount';
import { TOUCH_TARGET, colors, spacing, type } from '../theme';

/**
 * Header button into the notification centre, with an unread badge.
 *
 * The count is spelled out in the accessibility label rather than left to the
 * badge alone, because a small red circle is exactly the signal our users are
 * least likely to notice.
 */
export function NotificationBell() {
  const { unread } = useUnreadCount();
  const label =
    unread === 0
      ? 'Notifications, none unread'
      : `Notifications, ${unread} unread`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push('/notifications')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.icon}>🔔</Text>
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  pressed: { opacity: 0.6 },
  icon: { fontSize: 26 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 0,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 5,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    // Keeps the badge legible where it overlaps the bell glyph.
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    ...type.caption,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
