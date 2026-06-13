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
          ? 'border-[var(--color-volt)]/45 from-[var(--color-volt)]/12 to-transparent shadow-[0_0_30px_-8px_rgba(200,255,45,0.45)]'
          : 'border-[var(--color-blue)]/35 from-[var(--color-blue)]/14 to-transparent'
      }`}
    >
      <p
        className={`flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase ${
          live ? 'text-[var(--color-live)]' : 'text-[var(--color-volt)]'
        }`}
      >
        {live ? (
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-live)]" />
        ) : null}
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-[var(--color-bone)]">{courtLabel}</p>
      {/* When live, the label already carries "ends in …"; showing the (past) start
          time here would read as a future start, so only show it for upcoming games. */}
      {!live ? (
        <p className="mt-1 text-sm text-[var(--color-bone)]/70">
          {formatPanelTime(session.starts_at, now)}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link
          to={`/sessions/${session.id}`}
          className="rounded-full bg-[var(--color-volt)] px-5 py-2 text-sm font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90"
        >
          View session
        </Link>
        {court ? (
          <Link
            to={`/courts/${court.id}`}
            className="rounded-full border border-[var(--color-blue)]/40 px-5 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10"
          >
            View court
          </Link>
        ) : null}
      </div>
    </div>
  );
}
