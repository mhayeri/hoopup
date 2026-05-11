import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { useSession } from '../features/sessions/useSession';
import { formatSessionRange, relativeTime } from '../features/sessions/formatTime';
import SessionModal from '../features/sessions/SessionModal';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const validId = id && UUID_RE.test(id) ? id : null;
  const { session, loading, error, update, cancel } = useSession(validId);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (id && !validId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          Invalid session id
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

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[var(--color-hardwood)]">
          Loading session…
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
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-court)]">
          Session not found
        </h1>
        <p className="mt-3 text-[var(--color-ink)]/70">
          This session may have been removed or never existed.
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

  const cancelled = session.cancelled_at != null;
  const courtName = session.court?.name ?? 'Unnamed court';
  const hostName = session.host?.username ?? 'Unknown host';
  const isHost = user?.id === session.host_id;
  const startsInPast = new Date(session.starts_at).getTime() <= Date.now();

  async function onCancel() {
    if (!confirm('Cancel this session? Attendees will see it as cancelled.')) return;
    setCancelling(true);
    setCancelError(null);
    const { error: cancelErr } = await cancel();
    setCancelling(false);
    if (cancelErr) setCancelError(cancelErr);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        to={session.court ? `/courts/${session.court.id}` : '/map'}
        className="text-sm font-semibold text-[var(--color-court)] hover:underline"
      >
        ← Back to {session.court ? courtName : 'map'}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-court)]">
          {courtName}
        </h1>
        {cancelled ? (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-red-700">
            Cancelled
          </span>
        ) : (
          <span className="rounded-full bg-[var(--color-court)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-court)]">
            {relativeTime(session.starts_at)}
          </span>
        )}
      </div>

      <p className="mt-2 text-lg text-[var(--color-ink)]">
        {formatSessionRange(session.starts_at, session.ends_at)}
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink)]/70">
        Hosted by <span className="font-semibold text-[var(--color-ink)]">@{hostName}</span>
      </p>

      {session.notes ? (
        <section className="mt-8 rounded-lg border border-[var(--color-ink)]/10 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
            Notes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[var(--color-ink)]">{session.notes}</p>
        </section>
      ) : null}

      {isHost && !cancelled && !startsInPast ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-full border border-[var(--color-ink)]/20 px-5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelling ? 'Cancelling…' : 'Cancel session'}
          </button>
        </div>
      ) : null}

      {cancelError ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {cancelError}
        </p>
      ) : null}

      <section className="mt-12">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ink)]">
          Roster
        </h2>
        <p className="mt-3 text-[var(--color-ink)]/70">
          RSVPs land in the next feature branch. Cap is 15 per session.
        </p>
      </section>

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
    </main>
  );
}
