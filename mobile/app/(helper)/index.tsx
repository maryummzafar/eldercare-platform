import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { ApiError, api } from '../../src/api/client';
import type { BookingResponse } from '../../src/api/types';
import { useAuth } from '../../src/auth/AuthContext';
import { BookingCard } from '../../src/components/BookingCard';
import type { BookingAction } from '../../src/components/BookingCard';
import { Body, Button, Heading, Loading, Notice, Screen, Title } from '../../src/components/ui';

export default function HelperVisits() {
  const { session, signOut } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [page, profile] = await Promise.allSettled([
        api.listBookings({ size: 50 }),
        api.getMyHelperProfile(),
      ]);

      if (page.status === 'fulfilled') setBookings(page.value.content);
      else setError('Could not load your visits.');

      // A helper who has not filled in a profile yet gets a 404 here. That is an
      // expected state on first run, not an error worth showing.
      setHasProfile(profile.status === 'fulfilled');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: number, action: () => Promise<unknown>) {
    setActingOn(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That did not work. Please try again.');
    } finally {
      setActingOn(null);
    }
  }

  function actionsFor(booking: BookingResponse): BookingAction[] | undefined {
    switch (booking.status) {
      case 'REQUESTED':
        return [
          { label: 'Accept', onPress: () => act(booking.id, () => api.acceptBooking(booking.id)) },
          {
            label: 'Decline',
            variant: 'danger',
            onPress: () => act(booking.id, () => api.rejectBooking(booking.id)),
          },
        ];
      case 'ACCEPTED':
        return [
          {
            label: 'Start visit',
            onPress: () => act(booking.id, () => api.startBooking(booking.id)),
          },
          {
            label: 'Cancel',
            variant: 'danger',
            onPress: () => act(booking.id, () => api.cancelBooking(booking.id)),
          },
        ];
      case 'IN_PROGRESS':
        return [
          {
            label: 'Complete visit',
            onPress: () => act(booking.id, () => api.completeBooking(booking.id)),
          },
        ];
      default:
        return undefined;
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your visits" />
      </Screen>
    );
  }

  const pending = bookings.filter((b) => b.status === 'REQUESTED');
  const active = bookings.filter((b) => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS');
  const past = bookings.filter(
    (b) => !['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status),
  );

  return (
    <Screen>
      <Title>Hello, {session?.name?.split(' ')[0] ?? 'there'}</Title>

      {hasProfile === false && (
        <Notice
          tone="info"
          message="Set up your profile so elders can find you. You also need an admin to verify you before you appear in search."
        />
      )}

      <Button
        label={hasProfile ? 'Edit my profile' : 'Set up my profile'}
        variant={hasProfile ? 'secondary' : 'primary'}
        onPress={() => router.push('/(helper)/profile')}
      />

      {!!error && <Notice message={error} />}

      {bookings.length === 0 && (
        <Notice tone="info" message="No requests yet. They will appear here when an elder books you." />
      )}

      {pending.length > 0 && (
        <>
          <Heading>New requests</Heading>
          {pending.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              counterpartyLabel="For"
              counterpartyName={booking.elderName}
              busy={actingOn === booking.id}
              actions={actionsFor(booking)}
            />
          ))}
        </>
      )}

      {active.length > 0 && (
        <>
          <Heading>Coming up</Heading>
          {active.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              counterpartyLabel="For"
              counterpartyName={booking.elderName}
              busy={actingOn === booking.id}
              actions={actionsFor(booking)}
            />
          ))}
        </>
      )}

      {past.length > 0 && (
        <>
          <Heading>Past</Heading>
          {past.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              counterpartyLabel="For"
              counterpartyName={booking.elderName}
            />
          ))}
        </>
      )}

      <Button label="Refresh" variant="secondary" onPress={load} />
      <Body muted> </Body>
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
