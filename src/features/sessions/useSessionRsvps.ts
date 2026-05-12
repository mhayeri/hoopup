import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PG_ERROR_CODES, type RsvpWithProfile } from '../../lib/database.types';

/** Must match the cap in the enforce_session_cap trigger. */
const SESSION_CAP = 15;

type RsvpError = { code: 'SESSION_FULL' | 'SESSION_NOT_AVAILABLE' | 'UNKNOWN'; message: string };

type Result = {
  rsvps: RsvpWithProfile[];
  goingCount: number;
  waitlistCount: number;
  loading: boolean;
  error: string | null;
  rsvp: (userId: string) => Promise<{ error: RsvpError | null }>;
  joinWaitlist: (userId: string) => Promise<{ error: string | null }>;
  leave: (userId: string) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
};

/**
 * Fetches RSVPs for a session with joined profile data and exposes
 * rsvp / joinWaitlist / leave mutations. The 15-player cap is enforced
 * server-side by the `enforce_session_cap` trigger — a P0001 error from
 * INSERT is caught and surfaced as SESSION_FULL so the UI can offer
 * the waitlist flow.
 */
export function useSessionRsvps(sessionId: string | null | undefined): Result {
  const [rsvps, setRsvps] = useState<RsvpWithProfile[]>([]);
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
    if (!sessionId) {
      if (mountedRef.current) {
        setRsvps([]);
        setLoading(false);
      }
      return;
    }
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    const { data, error: queryError } = await supabase
      .from('session_rsvps')
      .select('*, profile:profiles!session_rsvps_user_id_fkey ( id, username, avatar_url )')
      .eq('session_id', sessionId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })
      .returns<RsvpWithProfile[]>();
    if (!mountedRef.current) return;
    if (queryError) {
      setError(queryError.message);
      setRsvps([]);
    } else {
      setRsvps((data ?? []).filter((r) => r.profile !== null));
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rsvp = useCallback(
    async (userId: string): Promise<{ error: RsvpError | null }> => {
      if (!sessionId) return { error: { code: 'UNKNOWN', message: 'No session' } };

      const { error: insertError } = await supabase
        .from('session_rsvps')
        .upsert({ session_id: sessionId, user_id: userId, status: 'going' as const });

      if (insertError) {
        if (insertError.code === PG_ERROR_CODES.SESSION_FULL) {
          return {
            error: {
              code: 'SESSION_FULL',
              message: 'Session is full — join the waitlist?',
            },
          };
        }
        if (insertError.code === PG_ERROR_CODES.SESSION_NOT_AVAILABLE) {
          return {
            error: {
              code: 'SESSION_NOT_AVAILABLE',
              message: 'This session has been cancelled.',
            },
          };
        }
        return { error: { code: 'UNKNOWN', message: insertError.message } };
      }
      await load();
      return { error: null };
    },
    [sessionId, load]
  );

  const joinWaitlist = useCallback(
    async (userId: string): Promise<{ error: string | null }> => {
      if (!sessionId) return { error: 'No session' };
      const { error: insertError } = await supabase
        .from('session_rsvps')
        .upsert({ session_id: sessionId, user_id: userId, status: 'waitlist' as const });
      if (insertError) return { error: insertError.message };
      await load();
      return { error: null };
    },
    [sessionId, load]
  );

  const leave = useCallback(
    async (userId: string): Promise<{ error: string | null }> => {
      if (!sessionId) return { error: 'No session' };
      const { error: updateError } = await supabase
        .from('session_rsvps')
        .update({ status: 'cancelled' as const })
        .eq('session_id', sessionId)
        .eq('user_id', userId);
      if (updateError) return { error: updateError.message };
      await load();
      return { error: null };
    },
    [sessionId, load]
  );

  const goingCount = rsvps.filter((r) => r.status === 'going').length;
  const waitlistCount = rsvps.filter((r) => r.status === 'waitlist').length;

  return {
    rsvps,
    goingCount,
    waitlistCount,
    loading,
    error,
    rsvp,
    joinWaitlist,
    leave,
    refresh: load,
  };
}

export { SESSION_CAP };
