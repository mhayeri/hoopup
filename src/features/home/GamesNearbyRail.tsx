import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import HomeSessionCard from './HomeSessionCard';
import type { UpcomingSession } from '../map/useUpcomingSessions';
import { getSessionStatus } from '../sessions/formatTime';
import { useNow } from '../../lib/useNow';

type Props = {
  sessions: UpcomingSession[];
  loading: boolean;
  error: string | null;
  /** Uppercase label shown above the cards, e.g. "Games near you". */
  heading: string;
  /** Session to drop from the rail (e.g. the one already shown as "Your next run"). */
  excludeSessionId?: string | null;
};

/** Most games to surface in the rail before "See all on the map". */
const MAX_CARDS = 4;

/**
 * The "Games near you" card stack used on the home page in both auth states.
 * Presentational over an already-fetched upcoming-sessions list (same pattern
 * as SessionPanel) — splits live ("Hooping") from upcoming via getSessionStatus
 * on a useNow tick, shows live first, caps the list, and links out to the map.
 */
export default function GamesNearbyRail({
  sessions,
  loading,
  error,
  heading,
  excludeSessionId = null,
}: Props) {
  const now = useNow();

  const { visible, onlyNextRun } = useMemo(() => {
    const live: UpcomingSession[] = [];
    const upcoming: UpcomingSession[] = [];
    // Did we skip an active/upcoming game *because* it's the next-run card?
    // If so and nothing else is left, the board isn't empty — it's just that
    // your only game is already shown above.
    let hadExcludedUpcoming = false;
    for (const entry of sessions) {
      const status = getSessionStatus(entry.session, now);
      if (status !== 'active' && status !== 'upcoming') continue;
      if (excludeSessionId && entry.session.id === excludeSessionId) {
        hadExcludedUpcoming = true;
        continue;
      }
      if (status === 'active') live.push(entry);
      else upcoming.push(entry);
    }
    const visible = [...live, ...upcoming].slice(0, MAX_CARDS).map((entry) => ({
      entry,
      live: getSessionStatus(entry.session, now) === 'active',
    }));
    return { visible, onlyNextRun: hadExcludedUpcoming && visible.length === 0 };
  }, [sessions, now, excludeSessionId]);

  return (
    <div className="rounded-2xl border border-[var(--color-ink)]/10 bg-white p-4 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.25)]">
      <p className="mb-3 flex items-center gap-2 px-1 text-xs font-bold tracking-[0.08em] text-emerald-700 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {heading}
      </p>

      {loading && sessions.length === 0 ? (
        <div className="flex flex-col gap-2.5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-start gap-3 px-1 py-4">
          <p className="text-sm text-[var(--color-ink)]/65">
            {onlyNextRun
              ? "That's the only game on the board right now. Host another or check back as more get scheduled."
              : 'No games scheduled yet. Be the first to host one.'}
          </p>
          <Link
            to="/map"
            className="rounded-full border border-[var(--color-court)]/40 bg-[var(--color-court)]/8 px-4 py-1.5 text-xs font-bold text-[var(--color-court)] transition hover:bg-[var(--color-court)]/12"
          >
            Browse the map →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {visible.map(({ entry, live }) => (
              <HomeSessionCard key={entry.session.id} entry={entry} now={now} live={live} />
            ))}
          </div>
          <Link
            to="/map"
            className="mt-2.5 block rounded-full bg-[var(--color-ink)]/4 px-4 py-2 text-center text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/8"
          >
            See all on the map →
          </Link>
        </>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-[88px] animate-pulse rounded-xl border border-[var(--color-ink)]/8 bg-[var(--color-ink)]/3" />
  );
}
