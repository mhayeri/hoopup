import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { useSessionRsvps, SESSION_CAP } from './useSessionRsvps';
import type { RsvpWithProfile } from '../../lib/database.types';

type Props = {
  sessionId: string;
  cancelled: boolean;
  hostId: string;
  startsAt: string;
};

export default function RosterSection({ sessionId, cancelled, hostId, startsAt }: Props) {
  const { user } = useAuth();
  const { rsvps, goingCount, waitlistCount, loading, error, rsvp, joinWaitlist, leave } =
    useSessionRsvps(sessionId);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const startsInPast = new Date(startsAt).getTime() <= Date.now();
  const isHost = user?.id === hostId;
  const myRsvp: RsvpWithProfile | undefined = user
    ? rsvps.find((r) => r.user_id === user.id)
    : undefined;
  const isFull = goingCount >= SESSION_CAP;
  const canAct = !cancelled && !startsInPast && !isHost;

  const goingList = rsvps.filter((r) => r.status === 'going');
  const waitlist = rsvps.filter((r) => r.status === 'waitlist');

  async function handleRsvp() {
    if (!user) return;
    setBusy(true);
    setActionError(null);
    setShowFullPrompt(false);
    const { error: rsvpErr } = await rsvp(user.id);
    setBusy(false);
    if (rsvpErr) {
      if (rsvpErr.code === 'SESSION_FULL') {
        setShowFullPrompt(true);
      } else {
        setActionError(rsvpErr.message);
      }
    }
  }

  async function handleJoinWaitlist() {
    if (!user) return;
    setBusy(true);
    setActionError(null);
    setShowFullPrompt(false);
    const { error: wlErr } = await joinWaitlist(user.id);
    setBusy(false);
    if (wlErr) setActionError(wlErr);
  }

  async function handleLeave() {
    if (!user) return;
    setBusy(true);
    setActionError(null);
    setShowFullPrompt(false);
    const { error: leaveErr } = await leave(user.id);
    setBusy(false);
    if (leaveErr) setActionError(leaveErr);
  }

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ink)]">
          Roster
        </h2>
        <span className="rounded-full bg-[var(--color-court)]/10 px-3 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-court)]">
          {goingCount} / {SESSION_CAP}
        </span>
      </div>

      {/* Action area */}
      {canAct ? (
        <div className="mt-4">
          {!user ? (
            <Link
              to={`/login?from=/sessions/${sessionId}`}
              className="rounded-full border border-[var(--color-ink)]/20 px-5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
            >
              Sign in to RSVP
            </Link>
          ) : !myRsvp || myRsvp.status === 'cancelled' ? (
            isFull ? (
              <button
                type="button"
                onClick={handleJoinWaitlist}
                disabled={busy}
                className="rounded-full border border-[var(--color-court)] px-5 py-2 text-sm font-semibold text-[var(--color-court)] transition hover:bg-[var(--color-court)]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Joining…' : 'Join waitlist'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRsvp}
                disabled={busy}
                className="rounded-full bg-[var(--color-court)] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Joining…' : "I'm in"}
              </button>
            )
          ) : myRsvp.status === 'going' ? (
            <button
              type="button"
              onClick={handleLeave}
              disabled={busy}
              className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Leaving…' : 'Leave'}
            </button>
          ) : myRsvp.status === 'waitlist' ? (
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-700">
                On waitlist
              </span>
              <button
                type="button"
                onClick={handleLeave}
                disabled={busy}
                className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Leaving…' : 'Leave'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* SESSION_FULL prompt */}
      {showFullPrompt ? (
        <div className="mt-3 flex items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>Session is full — join the waitlist?</span>
          <button
            type="button"
            onClick={handleJoinWaitlist}
            disabled={busy}
            className="rounded-full border border-amber-600 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
          >
            {busy ? 'Joining…' : 'Join waitlist'}
          </button>
        </div>
      ) : null}

      {/* Inline error */}
      {actionError ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {actionError}
        </p>
      ) : null}

      {/* Fetch error */}
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : loading ? (
        <p className="mt-4 text-sm text-[var(--color-ink)]/60">Loading roster…</p>
      ) : goingList.length === 0 && waitlist.length === 0 ? (
        <p className="mt-4 text-[var(--color-ink)]/70">No players yet. Be the first to join.</p>
      ) : (
        <>
          {/* Going list */}
          {goingList.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {goingList.map((r) => (
                <PlayerRow key={r.user_id} rsvp={r} />
              ))}
            </ul>
          ) : null}

          {/* Waitlist */}
          {waitlist.length > 0 ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setWaitlistOpen((v) => !v)}
                className="text-sm font-semibold text-[var(--color-hardwood)] hover:underline"
              >
                Waitlist ({waitlistCount}) {waitlistOpen ? 'Hide' : 'Show'}
              </button>
              {waitlistOpen ? (
                <ul className="mt-2 space-y-2">
                  {waitlist.map((r) => (
                    <PlayerRow key={r.user_id} rsvp={r} />
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function PlayerRow({ rsvp }: { rsvp: RsvpWithProfile }) {
  if (!rsvp.profile) return null;
  const { profile } = rsvp;
  return (
    <li className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-court)]/20 bg-[var(--color-net)]">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold uppercase text-[var(--color-hardwood)]/60">
            {profile.username.charAt(0)}
          </span>
        )}
      </div>
      <span className="text-sm font-semibold text-[var(--color-ink)]">@{profile.username}</span>
    </li>
  );
}
