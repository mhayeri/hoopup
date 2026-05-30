import { Link } from 'react-router-dom';
import type { UpcomingSession } from '../map/useUpcomingSessions';
import { formatPanelTime, formatTimeUntilEnd } from '../sessions/formatTime';
import { SESSION_CAP } from '../sessions/useSessionRsvps';
import { SKILL_PILL } from '../../lib/skill';

type Props = {
  entry: UpcomingSession;
  /** Current time, supplied by the parent rail so each card doesn't spin up its own timer. */
  now: Date;
  /** Render the live "Hooping · ends in …" treatment instead of a start time. */
  live?: boolean;
};

/**
 * Compact session card for the home "Games near you" rail. Mirrors the visual
 * idiom of the map's SessionCard (court name, time/live pill, host, going
 * count) but is a plain navigation link to the session detail page — no map
 * selection state and no inline friend button, so it's safe to show signed-out.
 */
export default function HomeSessionCard({ entry, now, live = false }: Props) {
  const { session, court, host, goingCount } = entry;
  const courtLabel = court?.name ?? court?.address ?? 'Basketball Court';
  const initial = host?.username.charAt(0).toUpperCase() ?? '?';

  return (
    <Link
      to={`/sessions/${session.id}`}
      className={`flex w-full flex-col gap-2 rounded-xl border bg-white/[0.03] px-4 py-3 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-volt)]/40 ${
        live
          ? 'border-[var(--color-volt)]/45 shadow-[0_0_24px_-6px_rgba(200,255,45,0.4)] hover:border-[var(--color-volt)]'
          : 'border-white/10 hover:border-[var(--color-blue)]/50'
      }`}
    >
      <p className="text-sm font-bold text-[var(--color-bone)]">{courtLabel}</p>
      {live ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-volt)] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#0c1402] uppercase">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0c1402]" />
          Hooping · {formatTimeUntilEnd(session.ends_at, now)}
        </span>
      ) : (
        <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-[var(--color-bone)]">
          {formatPanelTime(session.starts_at, now)}
        </span>
      )}
      <div className="flex items-center gap-2 text-xs">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-blue)]/40 bg-[var(--color-night-3)]">
          {host?.avatar_url ? (
            <img src={host.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-[var(--color-blue)] uppercase">
              {initial}
            </span>
          )}
        </div>
        <span className="truncate font-semibold text-[var(--color-bone)]/70">
          {host ? `@${host.username}` : 'Unknown host'}
        </span>
        {host?.skill_level ? (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase ${SKILL_PILL[host.skill_level]}`}
          >
            {host.skill_level}
          </span>
        ) : null}
        <span className="ml-auto whitespace-nowrap font-semibold text-[var(--color-bone)]/55">
          <span className="text-[var(--color-volt)]">{goingCount}</span>/{SESSION_CAP} going
        </span>
      </div>
    </Link>
  );
}
