import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, api } from '../../../src/api/client';
import type { BookingResponse, MessageResponse } from '../../../src/api/types';
import { SERVICE_LABELS, STATUS_LABELS } from '../../../src/api/types';
import { useAuth } from '../../../src/auth/AuthContext';
import { Avatar, Icon, Loading, Notice } from '../../../src/components/ui';
import { formatTimeRange } from '../../../src/format';
import { SERVICE_ICONS } from '../../../src/presentation';
import { CONTENT_MAX_WIDTH, TOUCH_TARGET, colors, fonts, radius, spacing, type } from '../../../src/theme';

/**
 * Refresh cadence while the thread is open. Short enough that a reply feels
 * immediate to someone waiting on it, and the request returns one small array.
 * The interval is torn down on unmount, so a backgrounded chat costs nothing.
 */
const POLL_INTERVAL_MS = 5_000;

/** Statuses where the server refuses new messages; mirrored here to explain why. */
const CLOSED_STATUSES = ['REJECTED', 'CANCELLED'];

export default function ChatScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const id = Number(bookingId);
  const { session } = useAuth();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!Number.isFinite(id)) return;
    try {
      const list = await api.listMessages(id);
      if (mountedRef.current) setMessages(list);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof ApiError ? err.message : 'Could not load the conversation.');
        setMessages((current) => current ?? []);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    // The booking is fetched once: it names the other party and tells us whether
    // the thread is still open to new messages.
    api.getBooking(id).then(
      (b) => {
        if (mountedRef.current) setBooking(b);
      },
      () => {},
    );
    void refresh();
    // Opening the thread is what clears its unread messages.
    api.markThreadRead(id).catch(() => {});

    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [id, refresh]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const sent = await api.sendMessage(id, { body });
      setDraft('');
      // Append rather than refetch, so the message lands without a round trip.
      setMessages((current) => [...(current ?? []), sent]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send that message.');
    } finally {
      setSending(false);
    }
  }, [draft, id, sending]);

  const otherName =
    booking && session ? (booking.elderId === session.userId ? booking.helperName : booking.elderName) : '';
  const closed = booking ? CLOSED_STATUSES.includes(booking.status) : false;
  const canSend = draft.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: otherName || 'Messages' }} />
      {messages === null ? (
        <Loading label="Loading conversation" />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <View style={styles.column}>
            {booking && (
              <View style={styles.context}>
                <Icon name={SERVICE_ICONS[booking.serviceType]} size={18} color={colors.primary} />
                <Text style={styles.contextText} numberOfLines={1}>
                  {SERVICE_LABELS[booking.serviceType]} · {formatTimeRange(booking.scheduledStart, booking.scheduledEnd)} ·{' '}
                  {STATUS_LABELS[booking.status]}
                </Text>
              </View>
            )}

            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.thread}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
              {messages.length === 0 ? (
                <View style={styles.empty}>
                  {!!otherName && <Avatar name={otherName} size={64} />}
                  <Text style={styles.emptyTitle}>Start the conversation</Text>
                  <Text style={styles.emptyText}>
                    Say hello, or ask anything you need to arrange the visit.
                  </Text>
                </View>
              ) : (
                messages.map((message, i) => {
                  const mine = session?.userId === message.senderId;
                  const grouped = i > 0 && messages[i - 1].senderId === message.senderId;
                  return (
                    <View
                      key={message.id}
                      accessibilityLabel={`${mine ? 'You' : message.senderName} said: ${message.body}`}
                      style={[
                        styles.bubble,
                        mine ? styles.bubbleMine : styles.bubbleTheirs,
                        grouped && styles.bubbleGrouped,
                      ]}>
                      <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.body}</Text>
                      <Text style={[styles.when, mine && styles.whenMine]}>
                        {new Date(message.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {!!error && (
              <View style={styles.noticeWrap}>
                <Notice message={error} />
              </View>
            )}

            {closed ? (
              <View style={styles.noticeWrap}>
                <Notice message="This booking is closed, so no new messages can be sent." tone="info" />
              </View>
            ) : (
              <View style={styles.composer}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Write a message"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Message to send"
                  multiline
                  // Starts one line tall (a browser textarea defaults to two) and grows.
                  numberOfLines={1}
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  accessibilityState={{ disabled: !canSend, busy: sending }}
                  disabled={!canSend}
                  onPress={send}
                  style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && canSend && styles.sendPressed]}>
                  <Icon name="send" size={20} color={colors.onPrimary} />
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },

  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  contextText: { ...type.small, color: colors.primary, flex: 1 },

  thread: { padding: spacing.md, gap: spacing.sm, flexGrow: 1, justifyContent: 'flex-end' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { ...type.heading, color: colors.text },
  emptyText: { ...type.body, color: colors.textMuted, textAlign: 'center' },

  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg, gap: 2 },
  bubbleGrouped: { marginTop: -4 },
  // Who sent it is signalled by side and fill together, never colour alone.
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderBottomLeftRadius: 6,
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.08)',
  },
  bubbleText: { ...type.body, color: colors.text },
  bubbleTextMine: { color: colors.onPrimary },
  when: { ...type.small, fontFamily: fonts.regular, color: colors.textMuted, alignSelf: 'flex-end' },
  // White on our primary clears AA at this size; the muted grey would not.
  whenMine: { color: colors.onPrimary, opacity: 0.85 },

  noticeWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    maxHeight: TOUCH_TARGET * 3,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    ...type.body,
    color: colors.text,
    backgroundColor: colors.surface,
    outlineStyle: 'none',
  } as object,
  send: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: colors.disabled },
  sendPressed: { backgroundColor: colors.primaryPressed },
});
