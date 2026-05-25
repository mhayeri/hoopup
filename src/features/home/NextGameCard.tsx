import { Link } from 'react-router-dom';
import type { ActiveSessionEntry } from '../sessions/useUserActiveSessions';
import {
  formatPanelTime,
  formatTimeUntilEnd,
  getSessionStatus,
  relativeTime,
} from '../sessions/formatTime';
import { useNow } from '../../lib/useNow';

/**
 * The signed-in "Your next run" hero card: the user's soonest active session
 * (hosted or RSVP'd, from useUserActiveSessions). Flips to a live "Hooping"
 * treatment once the game is in progress, and reflects a waitlisted role.
 */
export default function NextGameCard({ entry }: { entry: ActiveSessionEntry }) {
  const { session, court, role } = entry;
  const now = useNow();
  const live = getSessionStatus(session, now) === 'active';
  const courtLabel = court?.name ?? court?.address ?? 'Basketball Court';

  const label = live
    ? `Hooping · ${formatTimeUntilEnd(session.ends_at, now)}`
    : role === 'waitlist'
      ? `You're waitlisted · ${relativeTime(session.starts_at, now)}`
      : `You're going · ${relativeTime(session.starts_at, now)}`;

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 ${
        live
          ? 'border-emerald-400/60 from-emerald-50 to-emerald-500/5'
          : 'border-[var(--color-court)]/25 from-[var(--color-court)]/8 to-[var(--color-court)]/[0.02]'
      }`}
    >
      <p
        className={`flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase ${
          live ? 'text-emerald-600' : 'text-[var(--color-court)]'
        }`}
      >
        {live ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> : null}
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-[var(--color-ink)]">{courtLabel}</p>
      {/* When live, the label already carries "ends in …"; showing the (past) start
          time here would read as a future start, so only show it for upcoming games. */}
      {!live ? (
        <p className="mt-1 text-sm text-[var(--color-ink)]/70">
          {formatPanelTime(session.starts_at, now)}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link
          to={`/sessions/${session.id}`}
          className="rounded-full bg-[var(--color-court)] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90"
        >
          View session
        </Link>
        {court ? (
          <Link
            to={`/courts/${court.id}`}
            className="rounded-full border border-[var(--color-ink)]/20 bg-white px-5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
          >
            View court
          </Link>
        ) : null}
      </div>
    </div>
  );
}
