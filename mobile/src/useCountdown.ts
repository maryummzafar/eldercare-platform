import { useCallback, useEffect, useState } from 'react';

/**
 * Seconds left before something may be done again, such as resending a code.
 * Mirrors the server's one-minute cooldown so the button says when it will work
 * instead of failing.
 */
export function useCountdown(): { remaining: number; start: (seconds: number) => void } {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until <= now) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until, now]);

  const start = useCallback((seconds: number) => {
    const at = Date.now();
    setNow(at);
    setUntil(at + seconds * 1000);
  }, []);

  return { remaining: Math.max(0, Math.ceil((until - now) / 1000)), start };
}
