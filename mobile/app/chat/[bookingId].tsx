import { useLocalSearchParams } from 'expo-router';
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

import { ApiError, api } from '../../src/api/client';
import type { BookingResponse, MessageResponse } from '../../src/api/types';
import { STATUS_LABELS } from '../../src/api/types';
import { useAuth } from '../../src/auth/AuthContext';
import { Loading, Notice } from '../../src/components/ui';
import { formatDateTime } from '../../src/format';
import { CONTENT_MAX_WIDTH, TOUCH_TARGET, colors, radius, spacing, type } from '../../src/theme';

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

    // The booking header is fetched once: it names the other party and tells us
    // whether the thread is still open to new messages.
    api.getBooking(id).then(
      (b) => {
        if (mountedRef.current) setBooking(b);
      },
      () => {},
    );
    refresh();
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

  if (messages === null) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right']}>
        <Loading label="Loading conversation" />
      </SafeAreaView>
    );
  }

  const otherName =
    booking && session
      ? booking.elderId === session.userId
        ? booking.helperName
        : booking.elderName
      : null;

  const closed = booking ? CLOSED_STATUSES.includes(booking.status) : false;
  const canSend = draft.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.column}>
          {booking && (
            <View style={styles.header}>
              <Text style={styles.headerName}>{otherName}</Text>
              <Text style={styles.headerMeta}>{STATUS_LABELS[booking.status]}</Text>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.thread}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>
                No messages yet. Say hello, or ask anything you need to arrange the visit.
              </Text>
            ) : (
              messages.map((message) => {
                const mine = session?.userId === message.senderId;
                return (
                  <View
                    key={message.id}
                    accessibilityLabel={`${mine ? 'You' : message.senderName} said: ${message.body}`}
                    style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    {!mine && <Text style={styles.sender}>{message.senderName}</Text>}
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                      {message.body}
                    </Text>
                    <Text style={[styles.when, mine && styles.whenMine]}>
                      {formatDateTime(message.createdAt)}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {error && (
            <View style={styles.noticeWrap}>
              <Notice message={error} tone="error" />
            </View>
          )}

          {closed ? (
            <View style={styles.noticeWrap}>
              <Notice
                message="This booking is closed, so no new messages can be sent."
                tone="info"
              />
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
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                accessibilityState={{ disabled: !canSend, busy: sending }}
                disabled={!canSend}
                onPress={send}
                style={({ pressed }) => [
                  styles.send,
                  !canSend && styles.sendDisabled,
                  pressed && canSend && styles.sendPressed,
                ]}>
                <Text style={styles.sendLabel}>{sending ? 'Sending' : 'Send'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  headerName: { ...type.bodyStrong, color: colors.text },
  headerMeta: { ...type.caption, color: colors.textMuted },

  thread: { padding: spacing.lg, gap: spacing.md, flexGrow: 1, justifyContent: 'flex-end' },
  emptyText: { ...type.body, color: colors.textMuted, textAlign: 'center' },

  bubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  // Who sent it is signalled by side, fill and border together, never colour alone.
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm / 2,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm / 2,
  },
  sender: { ...type.caption, fontWeight: '700', color: colors.textMuted },
  bubbleText: { ...type.body, color: colors.text },
  bubbleTextMine: { color: colors.onPrimary },
  when: { ...type.caption, fontSize: 14, color: colors.textMuted },
  // White on our primary clears AA at this size; the muted grey would not.
  whenMine: { color: colors.onPrimary, opacity: 0.9 },

  noticeWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    maxHeight: TOUCH_TARGET * 3,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...type.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  send: {
    minHeight: TOUCH_TARGET,
    minWidth: 96,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: colors.disabled },
  sendPressed: { opacity: 0.85 },
  sendLabel: { ...type.bodyStrong, color: colors.onPrimary },
});
