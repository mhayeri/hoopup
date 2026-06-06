import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { NotificationWithActor } from '../../lib/database.types';
import { friendlyMessage } from '../../lib/errors';
import { NOTIFICATIONS_SELECT } from './notificationsApi';

/** Most recent notifications to load into the dropdown. */
const FEED_LIMIT = 30;
/** Background refetch cadence — the app has no Realtime, so we poll. */
const POLL_MS = 60_000;

type Result = {
  notifications: NotificationWithActor[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Optimistically stamps all unread rows read, persists, reverts on error. */
  markAllRead: () => Promise<{ error: string | null }>;
  /** Optimistically drops a row, deletes it, reverts on error. */
  remove: (id: string) => Promise<{ error: string | null }>;
};

/**
 * Loads the signed-in user's notification feed (newest first), exposes the
 * unread count, and keeps it fresh without Realtime: a single poll interval
 * plus a refetch when the tab/window regains focus. Mount this ONCE (in
 * NavBar) and pass the result down so there's only one timer app-wide.
 *
 * Notifications are owner-private (owner-only SELECT RLS), so passing a null
 * userId (signed out) yields an empty, inert feed.
 */
export function useNotifications(userId: string | null | undefined): Result {
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!userId) {
      if (mountedRef.current) {
        setNotifications([]);
        setLoading(false);
      }
      return;
    }
    if (mountedRef.current) setLoading(true);
    const { data, error: queryError } = await supabase
      .from('notifications')
      .select(NOTIFICATIONS_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(FEED_LIMIT)
      .returns<NotificationWithActor[]>();
    if (!mountedRef.current) return;
    if (queryError) {
      setError(friendlyMessage(queryError));
      setNotifications([]);
    } else {
      setError(null);
      setNotifications(data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll + refetch on focus/visibility — the cheap substitute for Realtime.
  // Keep `load` in a ref so these listeners subscribe once per userId, not on
  // every refetch.
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    if (!userId) return;
    const tick = () => void loadRef.current();
    const interval = window.setInterval(tick, POLL_MS);
    const onFocus = () => tick();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userId]);

  const markAllRead = useCallback(async (): Promise<{ error: string | null }> => {
    if (!userId) return { error: 'Not signed in' };
    const previous = notifications;
    if (!previous.some((n) => n.read_at === null)) return { error: null };
    const stamp = new Date().toISOString();
    setNotifications((cur) => cur.map((n) => (n.read_at ? n : { ...n, read_at: stamp }))); // optimistic
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: stamp })
      .eq('user_id', userId)
      .is('read_at', null);
    if (updateError) {
      if (mountedRef.current) setNotifications(previous); // revert
      return { error: friendlyMessage(updateError) };
    }
    return { error: null };
  }, [userId, notifications]);

  const remove = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      if (!userId) return { error: 'Not signed in' };
      const previous = notifications;
      setNotifications((cur) => cur.filter((n) => n.id !== id)); // optimistic
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (deleteError) {
        if (mountedRef.current) setNotifications(previous); // revert
        return { error: friendlyMessage(deleteError) };
      }
      return { error: null };
    },
    [userId, notifications]
  );

  const unreadCount = notifications.reduce((acc, n) => (n.read_at === null ? acc + 1 : acc), 0);

  return { notifications, unreadCount, loading, error, refresh: load, markAllRead, remove };
}
