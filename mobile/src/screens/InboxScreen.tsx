import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../api/client';
import type { NotificationResponse } from '../api/types';
import { EmptyState, Icon, Loading, Notice, Screen, ScreenHeader } from '../components/ui';
import { formatDateTime } from '../format';
import { NOTIFICATION_ICONS } from '../presentation';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const TONE_COLORS = {
  neutral: { bg: colors.surface, fg: colors.textMuted },
  info: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

/** Booking updates and new messages, newest first. */
export function InboxScreen() {
  const [items, setItems] = useState<NotificationResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const page = await api.listNotifications({ size: 50 });
      setItems(page.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load notifications.');
      setItems((current) => current ?? []);
    }
  }, []);

  // Reload every time the tab is shown, so acting elsewhere is reflected here.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const open = (item: NotificationResponse) => {
    // Marked read optimistically: the tap is the acknowledgement, and a failed
    // write here should not block navigation.
    if (!item.read) {
      setItems((current) => current?.map((n) => (n.id === item.id ? { ...n, read: true } : n)) ?? current);
      api.markNotificationRead(item.id).catch(() => {});
    }
    if (!item.bookingId) return;
    if (item.type === 'MESSAGE_RECEIVED') {
      router.push({ pathname: '/chat/[bookingId]', params: { bookingId: item.bookingId } });
    } else {
      router.navigate('/bookings');
    }
  };

  const markAll = async () => {
    setItems((current) => current?.map((n) => ({ ...n, read: true })) ?? current);
    try {
      await api.markAllNotificationsRead();
    } catch {
      void load();
    }
  };

  const hasUnread = !!items?.some((n) => !n.read);

  return (
    <Screen safeTop refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader
        title="Inbox"
        right={
          hasUnread ? (
            <Pressable accessibilityRole="button" onPress={markAll} style={styles.markAll}>
              <Icon name="checkmark-done" size={20} color={colors.primary} />
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {!!error && <Notice message={error} />}

      {items === null ? (
        <Loading label="Loading notifications" />
      ) : items.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="You're all caught up"
          body="Booking updates and messages will appear here."
        />
      ) : (
        <View style={styles.list}>
          {items.map((item, i) => {
            const meta = NOTIFICATION_ICONS[item.type];
            const tone = TONE_COLORS[meta?.tone ?? 'neutral'];
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.row,
                  i < items.length - 1 && styles.divider,
                  !item.read && styles.rowUnread,
                  pressed && styles.rowPressed,
                ]}>
                <View style={[styles.icon, { backgroundColor: tone.bg }]}>
                  <Icon name={meta?.icon ?? 'notifications-outline'} size={22} color={tone.fg} />
                </View>
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {/* Unread is a dot AND bold text AND a tint, never colour alone. */}
                    {!item.read && <View style={styles.dot} />}
                  </View>
                  <Text style={styles.text}>{item.body}</Text>
                  <Text style={styles.when}>{formatDateTime(item.createdAt)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 48, paddingLeft: spacing.sm },
  markAllText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primary },
  list: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.surface },
  rowUnread: { backgroundColor: '#F7FAFE' },
  rowPressed: { backgroundColor: colors.surface },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...type.bodyStrong, color: colors.text, flexShrink: 1 },
  titleUnread: { fontFamily: fonts.bold },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  text: { ...type.caption, color: colors.text },
  when: { ...type.small, color: colors.textMuted, marginTop: 2 },
});
