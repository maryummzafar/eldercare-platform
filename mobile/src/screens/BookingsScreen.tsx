import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../api/client';
import type { BookingResponse } from '../api/types';
import { BookingCard } from '../components/BookingCard';
import { EmptyState, Loading, Notice, Screen, ScreenHeader } from '../components/ui';
import { TOUCH_TARGET, colors, fonts, radius, spacing } from '../theme';
import { useBookingActions } from './useBookingActions';

const ACTIVE = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'];

/** Every booking for the signed-in user, split into what is coming and what is done. */
export function BookingsScreen({ role }: { role: 'ELDER' | 'HELPER' }) {
  const [bookings, setBookings] = useState<BookingResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const page = await api.listBookings({ size: 100 });
      setBookings(page.content);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Could not load your bookings.');
      setBookings((current) => current ?? []);
    }
  }, []);

  // Reload whenever the tab is shown, so a booking made elsewhere is already here.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const { actionsFor, actingOn, error } = useBookingActions(role, load);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const upcoming = (bookings ?? [])
    .filter((b) => ACTIVE.includes(b.status))
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const past = (bookings ?? []).filter((b) => !ACTIVE.includes(b.status));
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <Screen safeTop refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader title={role === 'HELPER' ? 'Visits' : 'Bookings'} />

      <View style={styles.segmented} accessibilityRole="tablist">
        <Segment label={`Upcoming${upcoming.length ? ` (${upcoming.length})` : ''}`} selected={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <Segment label="Past" selected={tab === 'past'} onPress={() => setTab('past')} />
      </View>

      {!!(loadError ?? error) && <Notice message={(loadError ?? error)!} />}

      {bookings === null ? (
        <Loading label="Loading your bookings" />
      ) : shown.length === 0 ? (
        tab === 'upcoming' ? (
          role === 'ELDER' ? (
            <EmptyState
              icon="calendar-outline"
              title="No upcoming bookings"
              body="When you book a helper, the visit will appear here."
              action={{ label: 'Find a helper', onPress: () => router.navigate('/home') }}
            />
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="No upcoming visits"
              body="Requests from elders will appear here. Make sure your profile is complete."
            />
          )
        ) : (
          <EmptyState icon="time-outline" title="Nothing here yet" body="Finished and cancelled bookings will appear here." />
        )
      ) : (
        shown.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            counterpartyName={role === 'HELPER' ? booking.elderName : booking.helperName}
            busy={actingOn === booking.id}
            actions={actionsFor(booking)}
          />
        ))
      )}
    </Screen>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.segment, selected && styles.segmentSelected]}>
      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: TOUCH_TARGET - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  // Selected is a raised white tile with bolder text, not a colour change alone.
  segmentSelected: { backgroundColor: colors.card, boxShadow: '0 1px 3px rgba(16, 24, 40, 0.12)' },
  segmentText: { fontFamily: fonts.medium, fontSize: 16, color: colors.textMuted },
  segmentTextSelected: { fontFamily: fonts.semibold, color: colors.text },
});
