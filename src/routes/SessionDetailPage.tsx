import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { useSession } from '../features/sessions/useSession';
import {
  formatSessionRange,
  formatTimeUntilEnd,
  getSessionStatus,
  relativeTime,
} from '../features/sessions/formatTime';
import SessionModal from '../features/sessions/SessionModal';
import RosterSection from '../features/sessions/RosterSection';
import { useCourtAddress } from '../features/map/useCourtAddress';
import { useNow } from '../lib/useNow';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const validId = id && UUID_RE.test(id) ? id : null;
  const { session, loading, error, update, cancel, refresh } = useSession(validId);
  const courtDisplayName = useCourtAddress(session?.court ?? null);
  const now = useNow();
  const [editOpen, setEditOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (id && !validId) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] text-[var(--color-bone)]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p
            role="alert"
            className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            Invalid session id
          </p>
          <Link
            to="/map"
            className="mt-4 inline-block text-sm font-semibold text-[var(--color-blue)] hover:underline"
          >
            &larr; Back to map
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] text-[var(--color-bone)]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="font-mono text-sm font-semibold tracking-[0.4em] text-[var(--color-bone)]/60 uppercase">
            Loading session...
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
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] text-[var(--color-bone)]">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-outline font-display text-5xl font-black tracking-wide uppercase md:text-6xl">
            Session not found
          </h1>
          <p className="mt-4 text-[var(--color-bone)]/70">
            This session may have been removed or never existed.
          </p>
          <Link
            to="/map"
            className="mt-6 inline-block text-sm font-semibold text-[var(--color-blue)] hover:underline"
          >
            &larr; Back to map
          </Link>
        </div>
      </main>
    );
  }

  const status = getSessionStatus(session, now);
  const cancelled = status === 'cancelled';
  const active = status === 'active';
  const courtName = courtDisplayName;
  const hostName = session.host?.username ?? 'Unknown host';
  const isHost = user?.id === session.host_id;
  const startsInPast = new Date(session.starts_at).getTime() <= now.getTime();

  async function onCancel() {
    if (!confirm('Cancel this session? Attendees will see it as cancelled.')) return;
    setCancelling(true);
    setCancelError(null);
    const { error: cancelErr } = await cancel();
    setCancelling(false);
    if (cancelErr) setCancelError(cancelErr);
  }

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] text-[var(--color-bone)]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to={session.court ? `/courts/${session.court.id}` : '/map'}
          className="font-mono text-xs font-semibold tracking-[0.18em] text-[var(--color-bone)]/55 uppercase transition hover:text-[var(--color-volt)]"
        >
          &larr; {session.court ? courtName : 'Back to map'}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-6xl leading-[0.9] font-black tracking-wide uppercase md:text-7xl">
            {courtName}
          </h1>
          {cancelled ? (
            <span className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 font-mono text-xs font-semibold tracking-[0.18em] text-red-300 uppercase">
              Cancelled
            </span>
          ) : active ? (
            <span className="glow-live inline-flex items-center gap-1.5 rounded-md bg-[var(--color-live)] px-3 py-1 font-mono text-xs font-semibold tracking-[0.18em] text-[var(--on-live)] uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--on-live)]" />
              Hooping - {formatTimeUntilEnd(session.ends_at, now)}
            </span>
          ) : (
            <span className="rounded-md bg-[var(--color-blue)]/15 px-3 py-1 font-mono text-xs font-semibold tracking-[0.18em] text-[var(--color-blue)] uppercase">
              {relativeTime(session.starts_at, now)}
            </span>
          )}
        </div>

        <p className="mt-3 font-mono text-base text-[var(--color-bone)]/90">
          {formatSessionRange(session.starts_at, session.ends_at)}
        </p>
        <p className="mt-1 text-sm text-[var(--color-bone)]/70">
          Hosted by{' '}
          {session.host?.username ? (
            <Link
              to={`/u/${session.host.username}`}
              className="font-semibold text-[var(--color-bone)] hover:text-[var(--color-volt)]"
            >
              @{hostName}
            </Link>
          ) : (
            <span className="font-semibold text-[var(--color-bone)]">@{hostName}</span>
          )}
        </p>

        {session.notes ? (
          <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="font-mono text-[10px] font-semibold tracking-[0.22em] text-[var(--color-bone)]/55 uppercase">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[var(--color-bone)]">{session.notes}</p>
          </section>
        ) : null}

        {isHost && !cancelled && !startsInPast ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-full border border-[var(--color-blue)]/50 px-5 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="rounded-full border border-red-500/40 px-5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? 'Cancelling...' : 'Cancel session'}
            </button>
          </div>
        ) : null}

        {cancelError ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {cancelError}
          </p>
        ) : null}

        <RosterSection
          sessionId={session.id}
          hostId={session.host_id}
          cancelled={cancelled}
          startsAt={session.starts_at}
          endsAt={session.ends_at}
          onAfterLeave={refresh}
        />

        {isHost ? (
          <SessionModal
            open={editOpen}
            title="Edit session"
            submitLabel="Save changes"
            initial={{
              startsAt: session.starts_at,
              endsAt: session.ends_at,
              notes: session.notes,
            }}
            onClose={() => setEditOpen(false)}
            onSubmit={async ({ startsAt, endsAt, notes }) => {
              const { error: updateErr } = await update({
                starts_at: startsAt,
                ends_at: endsAt,
                notes,
              });
              return { error: updateErr };
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
