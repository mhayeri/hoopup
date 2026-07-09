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
 * Compact session card for the home rail + games board. Mirrors the visual
 * idiom of the map's SessionCard (court name, time/live pill, host, going
 * count) but is a plain navigation link to the session detail page — no map
 * selection state and no inline friend button, so it's safe to show signed-out.
 */
export default function HomeSessionCard({ entry, now, live = false }: Props) {
  const { session, court, host, goingCount } = entry;
  const courtLabel = court?.name ?? court?.address ?? 'Basketball Court';
  const initial = host?.username.charAt(0).toUpperCase() ?? '?';
  const fillPct = Math.min((goingCount / SESSION_CAP) * 100, 100);

  return (
    <Link
      to={`/sessions/${session.id}`}
      className={`group flex w-full flex-col gap-2.5 rounded-2xl border bg-[var(--surface)] px-4 py-3.5 text-left backdrop-blur transition outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]/40 ${
        live
          ? 'glow-live border-[var(--color-live)]/45 hover:border-[var(--color-live)]'
          : 'border-[var(--border)] hover:border-[var(--color-blue)]/60'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-bold text-[var(--color-bone)]">{courtLabel}</p>
        <p className="shrink-0 font-mono text-xs font-semibold text-[var(--color-bone)]/50 tabular-nums">
          <span className={live ? 'text-[var(--color-live)]' : 'text-[var(--volt-text)]'}>
            {goingCount}
          </span>
          /{SESSION_CAP}
        </p>
      </div>

      {live ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--color-live)] px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-[var(--on-live)] uppercase">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--on-live)]" />
          Hooping · {formatTimeUntilEnd(session.ends_at, now)}
        </span>
      ) : (
        <span className="inline-flex w-fit items-center rounded-md bg-[var(--color-bone)]/8 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-[var(--color-bone)]/85">
          {formatPanelTime(session.starts_at, now)}
        </span>
      )}

      {/* Roster fill — 15 spots, volt while open, live color when hooping. */}
      <div
        aria-hidden
        className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-bone)]/10"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            live ? 'bg-[var(--color-live)]' : 'bg-[var(--color-volt)]/80'
          }`}
          style={{ width: `${fillPct}%` }}
        />
      </div>

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
        <span className="ml-auto hidden font-mono text-[10px] tracking-[0.18em] text-[var(--color-bone)]/35 uppercase transition group-hover:text-[var(--color-bone)]/60 sm:inline">
          View →
        </span>
      </div>
    </Link>
  );
}
