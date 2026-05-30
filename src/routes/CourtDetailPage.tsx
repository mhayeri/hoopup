import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../providers/useAuth';
import { useSessionsByCourt } from '../features/sessions/useSessionsByCourt';
import SessionListItem from '../features/sessions/SessionListItem';
import SessionModal from '../features/sessions/SessionModal';
import { createSession } from '../features/sessions/createSession';
import { getSessionStatus } from '../features/sessions/formatTime';
import { useCourtAddress } from '../features/map/useCourtAddress';
import FavoriteCourtButton from '../features/courts/FavoriteCourtButton';
import { useNow } from '../lib/useNow';
import { friendlyMessage } from '../lib/errors';

type Court = Database['public']['Tables']['courts']['Row'];

export default function CourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostModalOpen, setHostModalOpen] = useState(false);

  const courtDisplayName = useCourtAddress(court);

  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    refresh: refreshSessions,
  } = useSessionsByCourt(court?.id);

  const now = useNow();
  const { liveSessions, upcomingSessions } = useMemo(() => {
    const live: typeof sessions = [];
    const upcoming: typeof sessions = [];
    for (const s of sessions) {
      const status = getSessionStatus(s, now);
      if (status === 'active') live.push(s);
      // Cancelled-but-not-ended rows are intentionally returned by the
      // hook so RSVPed users see the cancellation; group them with
      // upcoming so they render with the Cancelled pill in the list.
      else if (status === 'upcoming' || status === 'cancelled') upcoming.push(s);
    }
    return { liveSessions: live, upcomingSessions: upcoming };
  }, [sessions, now]);

  useEffect(() => {
    if (!id) return;
    // parseInt + roundtrip rejects decimals ("3.5" → 3 ≠ "3.5"), trailing
    // junk ("3abc" → 3 ≠ "3abc"), and ids past Number.MAX_SAFE_INTEGER (which
    // would silently coerce to a different integer and fetch the wrong row).
    const courtId = parseInt(id, 10);
    if (!Number.isFinite(courtId) || courtId <= 0 || String(courtId) !== id) {
      setError('Invalid court id');
      setLoading(false);
      return;
    }
    setLoading(true);
    void supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (queryError) setError(friendlyMessage(queryError));
        else setCourt(data ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] text-[var(--color-bone)]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[var(--color-bone)]/60">
            Loading court…
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] text-[var(--color-bone)]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p
            role="alert"
            className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
          <Link
            to="/map"
            className="mt-4 inline-block text-sm font-semibold text-[var(--color-blue)] hover:underline"
          >
            Back to map
          </Link>
        </div>
      </main>
    );
  }

  if (!court) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] text-[var(--color-bone)]">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-bone)]">
            Court not found
          </h1>
          <p className="mt-3 text-[var(--color-bone)]/70">
            We couldn't find a court with that id. It may have been removed.
          </p>
          <Link
            to="/map"
            className="mt-6 inline-block text-sm font-semibold text-[var(--color-blue)] hover:underline"
          >
            Back to map
          </Link>
        </div>
      </main>
    );
  }

  const facts = [
    court.surface ? { label: 'Surface', value: court.surface } : null,
    court.hoops ? { label: 'Hoops', value: String(court.hoops) } : null,
    court.lit !== null ? { label: 'Lit at night', value: court.lit ? 'Yes' : 'No' } : null,
    {
      label: 'Coordinates',
      value: `${court.lat.toFixed(5)}, ${court.lng.toFixed(5)}`,
    },
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] text-[var(--color-bone)]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/map" className="text-sm font-semibold text-[var(--color-blue)] hover:underline">
          Back to map
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-bone)]">
            {courtDisplayName}
          </h1>
          <FavoriteCourtButton courtId={court.id} />
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {facts.map((f) => (
            <div
              key={f.label}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/60">
                {f.label}
              </dt>
              <dd className="mt-1 text-[var(--color-bone)]">{f.value}</dd>
            </div>
          ))}
        </dl>

        {liveSessions.length > 0 ? (
          <section className="mt-12">
            <div className="flex items-center gap-3">
              <h2 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight text-[var(--color-volt)]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-volt)]" />
                Hooping
              </h2>
              <span className="rounded-full bg-[var(--color-volt)]/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-volt)]">
                {liveSessions.length}
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {liveSessions.map((s) => (
                <li key={s.id}>
                  <SessionListItem session={s} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-bone)]">
              Upcoming sessions
            </h2>
            {user ? (
              <button
                type="button"
                onClick={() => setHostModalOpen(true)}
                className="rounded-full bg-[var(--color-volt)] px-5 py-2 text-sm font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90"
              >
                Host a session
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-white/8"
              >
                Sign in to host
              </Link>
            )}
          </div>

          {sessionsError ? (
            <p
              role="alert"
              className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {sessionsError}
            </p>
          ) : sessionsLoading ? (
            <p className="mt-4 text-sm text-[var(--color-bone)]/55">Loading sessions…</p>
          ) : upcomingSessions.length === 0 ? (
            <p className="mt-4 text-[var(--color-bone)]/70">
              {liveSessions.length > 0
                ? 'No future sessions scheduled yet.'
                : 'No upcoming sessions. Be the first to host one.'}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcomingSessions.map((s) => (
                <li key={s.id}>
                  <SessionListItem session={s} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {user ? (
        <SessionModal
          open={hostModalOpen}
          title="Host a session"
          submitLabel="Create"
          onClose={() => setHostModalOpen(false)}
          onSubmit={async ({ startsAt, endsAt, notes }) => {
            const result = await createSession({
              court_id: court.id,
              host_id: user.id,
              starts_at: startsAt,
              ends_at: endsAt,
              notes,
            });
            if (!result.error) await refreshSessions();
            return { error: result.error };
          }}
        />
      ) : null}
    </main>
  );
}
