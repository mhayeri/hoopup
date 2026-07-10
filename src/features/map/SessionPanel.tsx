import { Link } from 'react-router-dom';
import { useMemo, useState, type ReactNode } from 'react';
import SessionCard from './SessionCard';
import type { UpcomingSession } from './useUpcomingSessions';
import {
  getSessionStatus,
  isWithinTimeWindow,
  type SessionTimeWindow,
} from '../sessions/formatTime';
import { SESSION_CAP } from '../sessions/useSessionRsvps';
import type { SkillLevel } from '../../lib/database.types';
import { SKILL_TIER_COLOR } from '../../lib/skill';
import { useNow } from '../../lib/useNow';

export type MapFilter = 'sessions' | 'all';

const TIME_WINDOWS: [SessionTimeWindow, string][] = [
  ['any', 'Any time'],
  ['2h', 'Next 2h'],
  ['today', 'Today'],
  ['week', 'This week'],
];

type SkillFilter = SkillLevel | 'any';

const SKILL_OPTIONS: [SkillFilter, string][] = [
  ['any', 'Any'],
  ['beginner', 'Beg'],
  ['intermediate', 'Int'],
  ['advanced', 'Adv'],
  ['pro', 'Pro'],
];

type Props = {
  sessions: UpcomingSession[];
  loading: boolean;
  error: string | null;
  filter: MapFilter;
  onFilterChange: (next: MapFilter) => void;
  selectedSessionId: string | null;
  onSelectSession: (entry: UpcomingSession) => void;
};

/**
 * The "Find a game" panel. Floats over the map as a glass card on desktop;
 * docks to the bottom edge as an expandable drawer on mobile. Filters are a
 * flat system — mono section labels over borderless chip rows — instead of
 * nested boxed pill groups.
 */
export default function SessionPanel({
  sessions,
  loading,
  error,
  filter,
  onFilterChange,
  selectedSessionId,
  onSelectSession,
}: Props) {
  // Mobile-only collapsed/expanded drawer state. On desktop the panel is
  // always expanded; this only affects the `md:` and below layout.
  const [mobileExpanded, setMobileExpanded] = useState(false);
  // Session-list filters, applied client-side over the fetched list. Local to
  // the panel — they narrow the list only and never touch the map markers.
  const [timeWindow, setTimeWindow] = useState<SessionTimeWindow>('any');
  const [openOnly, setOpenOnly] = useState(false);
  const [skill, setSkill] = useState<SkillFilter>('any');
  const filtersActive = timeWindow !== 'any' || openOnly || skill !== 'any';
  const now = useNow();

  const { liveSessions, upcomingSessions } = useMemo(() => {
    // Open-spots and skill apply to both live and upcoming games. The time
    // window applies to upcoming only — live ("Hooping") games are already in
    // progress and stay visible regardless of the chosen window.
    const matchesOpen = (e: UpcomingSession) => !openOnly || e.goingCount < SESSION_CAP;
    const matchesSkill = (e: UpcomingSession) => skill === 'any' || e.host?.skill_level === skill;

    const live: UpcomingSession[] = [];
    const upcoming: UpcomingSession[] = [];
    for (const entry of sessions) {
      if (!matchesOpen(entry) || !matchesSkill(entry)) continue;
      const status = getSessionStatus(entry.session, now);
      if (status === 'active') live.push(entry);
      else if (
        status === 'upcoming' &&
        isWithinTimeWindow(entry.session.starts_at, timeWindow, now)
      )
        upcoming.push(entry);
    }
    return { liveSessions: live, upcomingSessions: upcoming };
  }, [sessions, now, openOnly, skill, timeWindow]);

  // Reflects the filtered count so the tab badge matches what's visible.
  const count = liveSessions.length + upcomingSessions.length;

  function clearFilters() {
    setTimeWindow('any');
    setOpenOnly(false);
    setSkill('any');
  }

  return (
    <aside className="flex max-h-full flex-col overflow-hidden rounded-t-3xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--color-night-2)_90%,transparent)] text-[var(--color-bone)] shadow-[0_-16px_50px_-20px_var(--drawer-shadow)] backdrop-blur-md md:h-full md:rounded-3xl md:shadow-[0_30px_80px_-30px_var(--elev-shadow)]">
      {/* Drawer handle (mobile only). */}
      <button
        type="button"
        onClick={() => setMobileExpanded((v) => !v)}
        aria-expanded={mobileExpanded}
        aria-label={mobileExpanded ? 'Collapse session list' : 'Expand session list'}
        className="block md:hidden"
      >
        <span className="mx-auto mt-2.5 mb-1 block h-1 w-9 rounded-full bg-[var(--color-bone)]/20" />
      </button>

      <div className="px-5 pt-3 pb-4 md:pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-3xl leading-none font-extrabold tracking-wide text-[var(--color-bone)] uppercase">
            Find a game
          </h2>
          <button
            type="button"
            onClick={() => setMobileExpanded((v) => !v)}
            aria-label={mobileExpanded ? 'Collapse' : 'Expand'}
            className="rounded-md px-1 py-0.5 text-sm text-[var(--color-bone)]/55 md:hidden"
          >
            {mobileExpanded ? '▾' : '▴'}
          </button>
        </div>

        {/* View toggle — one segmented control. */}
        <div
          role="tablist"
          aria-label="Map filter"
          className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1"
        >
          <SegmentTab active={filter === 'all'} onClick={() => onFilterChange('all')}>
            All courts
          </SegmentTab>
          <SegmentTab active={filter === 'sessions'} onClick={() => onFilterChange('sessions')}>
            Sessions
            {count > 0 || filtersActive ? (
              <span
                className={`ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold ${
                  filtersActive
                    ? 'bg-[var(--color-volt)] text-[var(--on-volt)]'
                    : 'bg-[var(--color-bone)]/12 text-[var(--color-bone)]'
                }`}
              >
                {count}
              </span>
            ) : null}
          </SegmentTab>
        </div>

        {filter === 'sessions' ? (
          <div className="mt-5 flex flex-col gap-4">
            <FilterRow label="When">
              {TIME_WINDOWS.map(([value, label]) => (
                <Chip key={value} active={timeWindow === value} onClick={() => setTimeWindow(value)}>
                  {label}
                </Chip>
              ))}
            </FilterRow>

            <FilterRow label="Host skill">
              {SKILL_OPTIONS.map(([value, label]) => (
                <Chip key={value} active={skill === value} onClick={() => setSkill(value)}>
                  {value !== 'any' ? (
                    <span
                      aria-hidden
                      className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: SKILL_TIER_COLOR[value] }}
                    />
                  ) : null}
                  {label}
                </Chip>
              ))}
            </FilterRow>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={openOnly}
                onClick={() => setOpenOnly((v) => !v)}
                className="group flex items-center gap-2.5 text-sm font-semibold text-[var(--color-bone)]/75 transition hover:text-[var(--color-bone)]"
              >
                <span
                  aria-hidden
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    openOnly ? 'bg-[var(--color-volt)]' : 'bg-[var(--color-bone)]/15'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      openOnly ? 'translate-x-4' : ''
                    }`}
                  />
                </span>
                Open spots only
              </button>
              {filtersActive ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--volt-text)] uppercase underline underline-offset-4"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`min-h-0 flex-col border-t border-[var(--border)] md:flex md:flex-1 ${
          mobileExpanded ? 'flex max-h-[45vh]' : 'hidden'
        }`}
      >
        <div className="flex flex-1 flex-col overflow-y-auto pb-4">
          {loading && sessions.length === 0 ? (
            <div className="flex flex-col gap-2 px-4 pt-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <p
              role="alert"
              className="mx-4 mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          ) : count === 0 ? (
            // Empty list. Distinguish "filters hid everything" from "nothing to
            // show" — the latter also covers the rare case where a fetched
            // session lapses to 'ended' in the ~30s gap before useNow ticks.
            filtersActive ? (
              <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
                <p className="text-sm text-[var(--color-bone)]/65">
                  No sessions match your filters.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-[var(--color-blue)]/45 bg-[var(--color-blue)]/10 px-4 py-1.5 text-xs font-bold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/18"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 px-5 py-6">
                <p className="text-sm text-[var(--color-bone)]/70">
                  No upcoming sessions yet. Be the first to host one. Click a court on the map.
                </p>
                <Link
                  to="/profile"
                  className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bone)] transition hover:bg-[var(--hover)]"
                >
                  View your sessions
                </Link>
              </div>
            )
          ) : (
            <>
              {liveSessions.length > 0 ? (
                <section>
                  <p className="flex items-center gap-1.5 px-5 pt-4 pb-2 font-mono text-[10px] font-semibold tracking-[0.22em] text-[var(--color-live)] uppercase">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-live)]" />
                    Hooping · {liveSessions.length}
                  </p>
                  <div className="flex flex-col gap-2 px-4">
                    {liveSessions.map((entry) => (
                      <SessionCard
                        key={entry.session.id}
                        entry={entry}
                        live
                        selected={selectedSessionId === entry.session.id}
                        onSelect={() => onSelectSession(entry)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              {upcomingSessions.length > 0 ? (
                <section>
                  <p className="px-5 pt-4 pb-2 font-mono text-[10px] font-semibold tracking-[0.22em] text-[var(--color-bone)]/55 uppercase">
                    Upcoming · {upcomingSessions.length}{' '}
                    {upcomingSessions.length === 1 ? 'session' : 'sessions'}
                  </p>
                  <div className="flex flex-col gap-2 px-4">
                    {upcomingSessions.map((entry) => (
                      <SessionCard
                        key={entry.session.id}
                        entry={entry}
                        selected={selectedSessionId === entry.session.id}
                        onSelect={() => onSelectSession(entry)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

/** One half of the All courts / Sessions segmented control. */
function SegmentTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-[var(--color-night-3)] text-[var(--color-bone)] shadow-sm'
          : 'text-[var(--color-bone)]/60 hover:text-[var(--color-bone)]'
      }`}
    >
      {children}
    </button>
  );
}

/** Mono section label + a flat row of chips. */
function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] font-semibold tracking-[0.22em] text-[var(--color-bone)]/45 uppercase">
        {label}
      </p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? 'border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--color-bone)]'
          : 'border-transparent text-[var(--color-bone)]/55 hover:text-[var(--color-bone)]'
      }`}
    >
      {children}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="h-[92px] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
  );
}
