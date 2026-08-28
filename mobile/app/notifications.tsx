import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, api } from '../src/api/client';
import { useAuth } from '../src/auth/AuthContext';
import type { NotificationResponse, NotificationType } from '../src/api/types';
import { Body, Button, Heading, Loading, Notice } from '../src/components/ui';
import { formatDateTime } from '../src/format';
import { CONTENT_MAX_WIDTH, colors, radius, spacing, type } from '../src/theme';

/** A glyph per type, so the list is scannable without reading every line. */
const ICONS: Record<NotificationType, string> = {
  BOOKING_REQUESTED: '📥',
  BOOKING_ACCEPTED: '✅',
  BOOKING_REJECTED: '🚫',
  BOOKING_STARTED: '▶️',
  BOOKING_COMPLETED: '🏁',
  BOOKING_CANCELLED: '❌',
  MESSAGE_RECEIVED: '💬',
};

export default function NotificationsScreen() {
  const { session } = useAuth();
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
      setItems([]);
    }
  }, []);

  // Reload every time the screen is shown, so acting elsewhere is reflected here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const open = useCallback(async (item: NotificationResponse) => {
    // Mark read optimistically: the tap is the acknowledgement, and a failed
    // write here should not block navigation.
    if (!item.read) {
      setItems((current) =>
        current?.map((n) => (n.id === item.id ? { ...n, read: true } : n)) ?? current,
      );
      api.markNotificationRead(item.id).catch(() => {});
    }
    if (item.bookingId) {
      if (item.type === 'MESSAGE_RECEIVED') {
        router.push({ pathname: '/chat/[bookingId]', params: { bookingId: item.bookingId } });
      } else {
        // Each role keeps its bookings on a different screen, so send them to
        // whichever one is actually theirs.
        router.push(session?.role === 'HELPER' ? '/(helper)' : '/(elder)/bookings');
      }
    }
  }, [session]);

  const markAll = useCallback(async () => {
    setItems((current) => current?.map((n) => ({ ...n, read: true })) ?? current);
    try {
      await api.markAllNotificationsRead();
    } catch {
      load();
    }
  }, [load]);

  if (items === null) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right']}>
        <Loading label="Loading notifications" />
      </SafeAreaView>
    );
  }

  const hasUnread = items.some((n) => !n.read);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {error && <Notice message={error} tone="error" />}

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Heading>Nothing yet</Heading>
            <Body muted>
              When a booking changes or someone messages you, it will appear here.
            </Body>
          </View>
        ) : (
          <>
            {hasUnread && (
              <Button label="Mark all as read" variant="secondary" onPress={markAll} />
            )}
            {items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.row,
                  // Unread is signalled by a filled background AND a left bar,
                  // never by colour alone.
                  !item.read && styles.rowUnread,
                  pressed && styles.rowPressed,
                ]}>
                <Text style={styles.icon}>{ICONS[item.type] ?? '🔔'}</Text>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowText}>{item.body}</Text>
                  <Text style={styles.rowWhen}>{formatDateTime(item.createdAt)}</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    flexGrow: 1,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },

  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rowUnread: {
    backgroundColor: colors.surface,
    borderLeftWidth: 6,
    borderLeftColor: colors.primary,
  },
  rowPressed: { opacity: 0.7 },
  icon: { fontSize: 26, lineHeight: 32 },
  rowBody: { flex: 1, gap: spacing.xs },
  rowTitle: { ...type.bodyStrong, color: colors.text },
  rowTitleUnread: { fontWeight: '700' },
  rowText: { ...type.body, color: colors.text },
  rowWhen: { ...type.caption, color: colors.textMuted },
});
