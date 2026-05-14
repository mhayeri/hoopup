import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import SessionCard from './SessionCard';
import type { UpcomingSession } from './useUpcomingSessions';
import { getSessionStatus } from '../sessions/formatTime';
import { useNow } from '../../lib/useNow';

export type MapFilter = 'sessions' | 'all';

type Props = {
  sessions: UpcomingSession[];
  loading: boolean;
  error: string | null;
  filter: MapFilter;
  onFilterChange: (next: MapFilter) => void;
  selectedSessionId: string | null;
  onSelectSession: (entry: UpcomingSession) => void;
};

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
  const count = sessions.length;
  const now = useNow();
  const { liveSessions, upcomingSessions } = useMemo(() => {
    const live: UpcomingSession[] = [];
    const upcoming: UpcomingSession[] = [];
    for (const entry of sessions) {
      const status = getSessionStatus(entry.session, now);
      if (status === 'active') live.push(entry);
      else if (status === 'upcoming') upcoming.push(entry);
    }
    return { liveSessions: live, upcomingSessions: upcoming };
  }, [sessions, now]);

  return (
    <aside
      className={`relative flex w-full flex-col overflow-hidden bg-white shadow-[0_-10px_24px_-12px_rgba(0,0,0,0.18)] md:h-full md:w-[340px] md:border-r md:border-[var(--color-ink)]/10 md:shadow-none`}
    >
      <button
        type="button"
        onClick={() => setMobileExpanded((v) => !v)}
        aria-expanded={mobileExpanded}
        aria-label={mobileExpanded ? 'Collapse session list' : 'Expand session list'}
        className="block md:hidden"
      >
        <span className="mx-auto mt-2 mb-1 block h-1 w-9 rounded-full bg-[var(--color-ink)]/20" />
      </button>

      <div className="border-b border-[var(--color-ink)]/6 px-5 pt-3 pb-3 md:pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none tracking-wide text-[var(--color-ink)]">
            Find a game
          </h2>
          <button
            type="button"
            onClick={() => setMobileExpanded((v) => !v)}
            aria-label={mobileExpanded ? 'Collapse' : 'Expand'}
            className="rounded-md px-1 py-0.5 text-base text-[var(--color-ink)]/55 md:hidden"
          >
            {mobileExpanded ? '▼' : '▲'}
          </button>
        </div>
        <div
          role="tablist"
          aria-label="Map filter"
          className="inline-flex gap-1 rounded-full bg-[var(--color-ink)]/5 p-1"
        >
          <FilterTab active={filter === 'all'} onClick={() => onFilterChange('all')}>
            All courts
          </FilterTab>
          <FilterTab active={filter === 'sessions'} onClick={() => onFilterChange('sessions')}>
            Sessions
            {count > 0 ? (
              <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-court)] px-1.5 text-[10px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </FilterTab>
        </div>
      </div>

      <div
        className={`flex-col md:flex md:flex-1 md:min-h-0 ${mobileExpanded ? 'flex max-h-[50vh]' : 'hidden'}`}
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
              className="mx-4 mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </p>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-start gap-3 px-5 py-6">
              <p className="text-sm text-[var(--color-ink)]/70">
                No upcoming sessions yet. Be the first to host one — click a court on the map.
              </p>
              <Link
                to="/profile"
                className="rounded-full border border-[var(--color-ink)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
              >
                View your sessions
              </Link>
            </div>
          ) : (
            <>
              {liveSessions.length > 0 ? (
                <section>
                  <p className="flex items-center gap-1.5 px-5 pt-4 pb-2 text-[11px] font-bold tracking-[0.12em] text-emerald-600 uppercase">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Currently Hooping · {liveSessions.length}
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
                  <p className="px-5 pt-4 pb-2 text-[11px] font-bold tracking-[0.12em] text-[var(--color-ink)]/55 uppercase">
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

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-white text-[var(--color-ink)] shadow-sm'
          : 'text-[var(--color-ink)]/70 hover:text-[var(--color-ink)]'
      }`}
    >
      {children}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="h-[92px] animate-pulse rounded-xl border border-[var(--color-ink)]/8 bg-[var(--color-ink)]/3" />
  );
}
