import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

/**
 * How often the badge asks the server for the unread count.
 *
 * There is no device push yet, so this poll *is* the delivery mechanism. Twenty
 * seconds keeps the badge feeling live without a request every time a screen
 * re-renders; the endpoint returns a single integer, so the cost is small.
 */
const POLL_INTERVAL_MS = 20_000;

/**
 * Unread notification count for the signed-in user, refreshed on a timer and
 * whenever the app returns to the foreground. Returns 0 while signed out.
 */
export function useUnreadCount(): { unread: number; refresh: () => void } {
  const { session } = useAuth();
  const [unread, setUnread] = useState(0);
  // Survives re-renders so an in-flight poll can be discarded after sign-out.
  const activeRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!session) {
      setUnread(0);
      return;
    }
    try {
      const { unread: count } = await api.unreadNotificationCount();
      if (activeRef.current) setUnread(count);
    } catch {
      // A failed poll is not worth interrupting the user for — the badge simply
      // keeps its last value and the next tick tries again.
    }
  }, [session]);

  useEffect(() => {
    activeRef.current = true;
    refresh();

    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    // Coming back from the background is the moment the count is most stale.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      activeRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh]);

  return { unread, refresh };
}
