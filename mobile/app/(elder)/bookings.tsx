import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { ApiError, api } from '../../src/api/client';
import type { BookingResponse } from '../../src/api/types';
import { BookingCard } from '../../src/components/BookingCard';
import { Button, Loading, Notice, Screen, Title } from '../../src/components/ui';

export default function ElderBookings() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const page = await api.listBookings({ size: 50 });
      setBookings(page.content);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: number) {
    setActingOn(id);
    setError(null);
    try {
      await api.cancelBooking(id);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not cancel that booking.');
    } finally {
      setActingOn(null);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your bookings" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>My bookings</Title>

      {!!error && <Notice message={error} />}

      {bookings.length === 0 ? (
        <>
          <Notice tone="info" message="You have not booked any help yet." />
          <Button label="Find a helper" onPress={() => router.replace('/(elder)')} />
        </>
      ) : (
        bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            counterpartyLabel="Helper"
            counterpartyName={booking.helperName}
            busy={actingOn === booking.id}
            // Cancelling is only legal before the visit starts; offering the
            // button later would just surface a server error.
            actions={
              booking.status === 'REQUESTED' || booking.status === 'ACCEPTED'
                ? [
                    {
                      label: 'Cancel this booking',
                      variant: 'danger' as const,
                      onPress: () => cancel(booking.id),
                    },
                  ]
                : undefined
            }
          />
        ))
      )}

      <Button label="Refresh" variant="secondary" onPress={load} />
    </Screen>
  );
}
