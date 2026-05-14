import { useEffect, useState } from 'react';

/**
 * Returns a `Date` that updates on a fixed interval so consumers re-render
 * as time advances. Drives "Currently Hooping" status transitions across
 * the app (upcoming → active → ended) without requiring a page refresh.
 *
 * 30s default is fine for minute-resolution display; pass a smaller value
 * if you need a finer tick.
 */
export function useNow(intervalMs: number = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
