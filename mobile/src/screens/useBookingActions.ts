import { router } from 'expo-router';
import { useState } from 'react';

import { ApiError, api } from '../api/client';
import type { BookingResponse } from '../api/types';
import type { BookingAction } from '../components/BookingCard';
import { confirm } from '../confirm';

/**
 * What each side can do with a booking in its current state. Mirrors the server's
 * rules so the app never offers a button that can only fail; the server still
 * decides.
 */
export function useBookingActions(role: 'ELDER' | 'HELPER', reload: () => Promise<void>) {
  const [actingOn, setActingOn] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(id: number, action: () => Promise<unknown>) {
    setActingOn(id);
    setError(null);
    try {
      await action();
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That did not work. Please try again.');
    } finally {
      setActingOn(null);
    }
  }

  const message = (b: BookingResponse): BookingAction => ({
    label: 'Message',
    icon: 'chatbubble-ellipses-outline',
    variant: 'secondary',
    onPress: () => router.push({ pathname: '/chat/[bookingId]', params: { bookingId: b.id } }),
  });

  const cancel = (b: BookingResponse): BookingAction => ({
    label: 'Cancel',
    icon: 'close',
    variant: 'danger',
    onPress: async () => {
      const other = role === 'ELDER' ? b.helperName : b.elderName;
      if (await confirm('Cancel this booking?', `${other} will be told it is cancelled.`, 'Cancel booking')) {
        void run(b.id, () => api.cancelBooking(b.id));
      }
    },
  });

  function actionsFor(b: BookingResponse): BookingAction[] {
    if (role === 'ELDER') {
      switch (b.status) {
        case 'REQUESTED':
        case 'ACCEPTED':
          return [message(b), cancel(b)];
        case 'IN_PROGRESS':
        case 'COMPLETED':
          return [message(b)];
        default:
          // REJECTED and CANCELLED: the server closes the thread, so offer nothing.
          return [];
      }
    }
    switch (b.status) {
      case 'REQUESTED':
        return [
          { label: 'Accept', icon: 'checkmark', onPress: () => run(b.id, () => api.acceptBooking(b.id)) },
          {
            label: 'Decline',
            icon: 'close',
            variant: 'danger',
            onPress: async () => {
              if (await confirm('Decline this request?', `${b.elderName} will be told you cannot take it.`, 'Decline')) {
                void run(b.id, () => api.rejectBooking(b.id));
              }
            },
          },
          message(b),
        ];
      case 'ACCEPTED':
        return [
          { label: 'Start visit', icon: 'play', onPress: () => run(b.id, () => api.startBooking(b.id)) },
          message(b),
          cancel(b),
        ];
      case 'IN_PROGRESS':
        return [
          {
            label: 'Complete visit',
            icon: 'checkmark-done',
            onPress: () => run(b.id, () => api.completeBooking(b.id)),
          },
          message(b),
        ];
      case 'COMPLETED':
        return [message(b)];
      default:
        return [];
    }
  }

  return { actionsFor, actingOn, error };
}
