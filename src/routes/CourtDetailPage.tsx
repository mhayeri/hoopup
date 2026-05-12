import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../providers/useAuth';
import { useSessionsByCourt } from '../features/sessions/useSessionsByCourt';
import SessionListItem from '../features/sessions/SessionListItem';
import SessionModal from '../features/sessions/SessionModal';
import { createSession } from '../features/sessions/createSession';
import { useCourtAddress } from '../features/map/useCourtAddress';

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
        if (queryError) setError(queryError.message);
        else setCourt(data ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[var(--color-hardwood)]">
          Loading court…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
        <Link
          to="/map"
          className="mt-4 inline-block text-sm font-semibold text-[var(--color-court)] hover:underline"
        >
          ← Back to map
        </Link>
      </main>
    );
  }

  if (!court) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-court)]">
          Court not found
        </h1>
        <p className="mt-3 text-[var(--color-ink)]/70">
          We couldn't find a court with that id. It may have been removed.
        </p>
        <Link
          to="/map"
          className="mt-6 inline-block text-sm font-semibold text-[var(--color-court)] hover:underline"
        >
          ← Back to map
        </Link>
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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/map" className="text-sm font-semibold text-[var(--color-court)] hover:underline">
        ← Back to map
      </Link>
      <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-[var(--color-court)]">
        {courtDisplayName}
      </h1>

      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {facts.map((f) => (
          <div
            key={f.label}
            className="rounded-lg border border-[var(--color-ink)]/10 bg-white px-4 py-3"
          >
            <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
              {f.label}
            </dt>
            <dd className="mt-1 text-[var(--color-ink)]">{f.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ink)]">
            Upcoming sessions
          </h2>
          {user ? (
            <button
              type="button"
              onClick={() => setHostModalOpen(true)}
              className="rounded-full bg-[var(--color-court)] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90"
            >
              Host a session
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-[var(--color-ink)]/20 px-5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
            >
              Sign in to host
            </Link>
          )}
        </div>

        {sessionsError ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {sessionsError}
          </p>
        ) : sessionsLoading ? (
          <p className="mt-4 text-sm text-[var(--color-ink)]/60">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-[var(--color-ink)]/70">
            No upcoming sessions. Be the first to host one.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <SessionListItem session={s} />
              </li>
            ))}
          </ul>
        )}
      </section>

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
