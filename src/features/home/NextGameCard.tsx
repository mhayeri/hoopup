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
      className={`rounded-3xl border bg-gradient-to-br p-6 backdrop-blur ${
        live
          ? 'glow-live-strong border-[var(--color-live)]/45 from-[var(--color-live)]/12 to-transparent'
          : 'border-[var(--color-blue)]/35 from-[var(--color-blue)]/14 to-transparent'
      }`}
    >
      <p
        className={`flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.18em] uppercase ${
          live ? 'text-[var(--color-live)]' : 'text-[var(--volt-text)]'
        }`}
      >
        {live ? (
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-live)]" />
        ) : null}
        {label}
      </p>
      <p className="mt-3 font-display text-4xl leading-[0.95] font-extrabold tracking-wide text-[var(--color-bone)] uppercase md:text-5xl">
        {courtLabel}
      </p>
      {/* When live, the label already carries "ends in …"; showing the (past) start
          time here would read as a future start, so only show it for upcoming games. */}
      {!live ? (
        <p className="mt-2.5 font-mono text-sm text-[var(--color-bone)]/70">
          {formatPanelTime(session.starts_at, now)}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link
          to={`/sessions/${session.id}`}
          className="sheen rounded-full bg-[var(--color-volt)] px-5 py-2.5 text-sm font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:scale-[1.03] active:scale-[0.98]"
        >
          View session
        </Link>
        {court ? (
          <Link
            to={`/courts/${court.id}`}
            className="rounded-full border border-[var(--color-blue)]/40 px-5 py-2.5 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10 active:scale-[0.98]"
          >
            View court
          </Link>
        ) : null}
      </div>
    </div>
  );
}
