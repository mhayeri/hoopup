import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { useSessionRsvps, SESSION_CAP, FLOOR_SIZE } from './useSessionRsvps';
import type { RsvpWithProfile } from '../../lib/database.types';
import { useNow } from '../../lib/useNow';
import { formatTimeUntilEnd } from './formatTime';
import PlayerRow, { ROW_GRID } from './PlayerRow';

type Props = {
  sessionId: string;
  hostId: string;
  cancelled: boolean;
  startsAt: string;
  endsAt: string;
  /**
   * Called after a successful leave so the parent can refresh the session
   * row — necessary because the solo-host-leaves trigger may have just set
   * `cancelled_at`, and the cached session needs to reflect that.
   */
  onAfterLeave?: () => Promise<void> | void;
};

/** Section divider label ("On the floor", "Bench") with a trailing rule. */
function SubLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 mb-2.5 flex items-center gap-2.5 font-mono text-[10px] font-semibold tracking-[0.22em] text-[var(--color-bone)]/55 uppercase">
      <span>{children}</span>
      <span className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

/** Horizontal-scroll wrapper so the box-score columns keep alignment on narrow screens. */
function ScrollX({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[460px]">{children}</div>
    </div>
  );
}

export default function RosterSection({
  sessionId,
  hostId,
  cancelled,
  startsAt,
  endsAt,
  onAfterLeave,
}: Props) {
  const { user } = useAuth();
  const { rsvps, goingCount, waitlistCount, loading, error, rsvp, joinWaitlist, leave } =
    useSessionRsvps(sessionId);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const now = useNow();
  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();
  const startsInPast = startMs <= now.getTime();
  const inProgress = !cancelled && startMs <= now.getTime() && now.getTime() < endMs;
  const myRsvp: RsvpWithProfile | undefined = user
    ? rsvps.find((r) => r.user_id === user.id)
    : undefined;
  const isFull = goingCount >= SESSION_CAP;
  const canAct = !cancelled && !startsInPast;

  // Confirmed (going) players, host pinned first; the hook already returns rows
  // created_at-ascending and Array.sort is stable, so everyone else keeps RSVP
  // order. First FLOOR_SIZE are on the floor; the rest (up to the cap) are bench.
  const goingSorted = [...rsvps]
    .filter((r) => r.status === 'going')
    .sort((a, b) => Number(b.user_id === hostId) - Number(a.user_id === hostId));
  const floor = goingSorted.slice(0, FLOOR_SIZE);
  const bench = goingSorted.slice(FLOOR_SIZE);
  const waitlist = rsvps.filter((r) => r.status === 'waitlist');

  const isHost = (r: RsvpWithProfile) => r.user_id === hostId;
  const isYou = (r: RsvpWithProfile) => !!user && r.user_id === user.id;

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
    if (!leaveErr && onAfterLeave) {
      await onAfterLeave();
    }
    setBusy(false);
    if (leaveErr) setActionError(leaveErr);
  }

  // Box-score column header (rendered once, above the floor list).
  const columnHeader = (
    <div
      className={`${ROW_GRID} rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[var(--color-bone)]/60 uppercase`}
    >
      <span className="text-center">#</span>
      <span aria-hidden />
      <span>Player</span>
      <span className="text-center">Pos</span>
      <span>Skill</span>
      <span className="text-center">Yrs</span>
    </div>
  );

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-4xl font-extrabold tracking-wide text-[var(--color-bone)] uppercase">
          Roster
        </h2>
        <span className="rounded-md bg-[var(--color-blue)]/15 px-3 py-0.5 font-mono text-xs font-semibold text-[var(--color-blue)] tabular-nums">
          {goingCount} / {SESSION_CAP}
        </span>
      </div>

      {inProgress ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-[var(--color-live)] px-3 py-1 font-mono text-xs font-semibold tracking-[0.14em] text-[var(--on-live)] uppercase">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--on-live)]" />
          Hooping - {formatTimeUntilEnd(endsAt, now)} - RSVPs locked
        </p>
      ) : null}

      {/* Action area */}
      {canAct ? (
        <div className="mt-4">
          {!user ? (
            <Link
              to={`/login?from=/sessions/${sessionId}`}
              className="rounded-full border border-[var(--color-blue)]/50 px-5 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10"
            >
              Sign in to RSVP
            </Link>
          ) : !myRsvp || myRsvp.status === 'cancelled' ? (
            isFull ? (
              <button
                type="button"
                onClick={handleJoinWaitlist}
                disabled={busy}
                className="rounded-full border border-[var(--color-blue)]/50 px-5 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Joining...' : 'Join waitlist'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRsvp}
                disabled={busy}
                className="sheen rounded-full bg-[var(--color-volt)] px-5 py-2 text-sm font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Joining...' : "I'm in"}
              </button>
            )
          ) : myRsvp.status === 'going' ? (
            <button
              type="button"
              onClick={handleLeave}
              disabled={busy}
              className="rounded-full border border-red-500/40 px-5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Leaving...' : 'Leave'}
            </button>
          ) : myRsvp.status === 'waitlist' ? (
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--color-bone)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/80">
                On waitlist
              </span>
              <button
                type="button"
                onClick={handleLeave}
                disabled={busy}
                className="rounded-full border border-red-500/40 px-5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* SESSION_FULL prompt */}
      {showFullPrompt ? (
        <div className="mt-3 flex items-center gap-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--color-bone)]/80">
          <span>Session is full - join the waitlist?</span>
          <button
            type="button"
            onClick={handleJoinWaitlist}
            disabled={busy}
            className="rounded-full border border-[var(--color-blue)]/50 px-3 py-1 text-xs font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10 disabled:opacity-60"
          >
            {busy ? 'Joining...' : 'Join waitlist'}
          </button>
        </div>
      ) : null}

      {/* Inline error */}
      {actionError ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {actionError}
        </p>
      ) : null}

      {/* Fetch error / loading / empty / roster */}
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      ) : loading ? (
        <p className="mt-4 text-sm text-[var(--color-bone)]/60">Loading roster...</p>
      ) : goingSorted.length === 0 && waitlist.length === 0 ? (
        <p className="mt-4 text-[var(--color-bone)]/70">No players yet. Be the first to join.</p>
      ) : (
        <>
          {/* On the floor (#1–FLOOR_SIZE) */}
          {floor.length > 0 ? (
            <>
              <SubLabel>On the floor - {floor.length}</SubLabel>
              <ScrollX>
                {columnHeader}
                <ul className="mt-1.5 space-y-1.5">
                  {floor.map((r, i) => (
                    <PlayerRow
                      key={r.user_id}
                      rsvp={r}
                      isHost={isHost(r)}
                      isYou={isYou(r)}
                      jersey={i + 1}
                    />
                  ))}
                </ul>
              </ScrollX>
            </>
          ) : null}

          {/* Bench (#FLOOR_SIZE+1 ... cap) */}
          {bench.length > 0 ? (
            <>
              <SubLabel>Bench - {bench.length}</SubLabel>
              <ScrollX>
                <ul className="space-y-1.5">
                  {bench.map((r, i) => (
                    <PlayerRow
                      key={r.user_id}
                      rsvp={r}
                      isHost={isHost(r)}
                      isYou={isYou(r)}
                      jersey={FLOOR_SIZE + i + 1}
                    />
                  ))}
                </ul>
              </ScrollX>
            </>
          ) : null}

          {/* Waitlist (overflow past the cap — collapsible, no jersey number) */}
          {waitlist.length > 0 ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setWaitlistOpen((v) => !v)}
                className="text-sm font-semibold text-[var(--color-bone)]/55 hover:text-[var(--color-bone)] hover:underline"
              >
                Waitlist ({waitlistCount}) {waitlistOpen ? 'Hide' : 'Show'}
              </button>
              {waitlistOpen ? (
                <ScrollX>
                  <ul className="mt-2 space-y-1.5">
                    {waitlist.map((r) => (
                      <PlayerRow
                        key={r.user_id}
                        rsvp={r}
                        isHost={isHost(r)}
                        isYou={isYou(r)}
                        jersey={null}
                      />
                    ))}
                  </ul>
                </ScrollX>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
