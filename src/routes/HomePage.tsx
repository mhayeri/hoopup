import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { useProfile } from '../features/profiles/useProfile';
import { useUpcomingSessions, type UpcomingSession } from '../features/map/useUpcomingSessions';
import { useUserActiveSessions } from '../features/sessions/useUserActiveSessions';
import { getSessionStatus, isWithinTimeWindow } from '../features/sessions/formatTime';
import { useNow } from '../lib/useNow';
import GamesNearbyRail from '../features/home/GamesNearbyRail';
import NextGameCard from '../features/home/NextGameCard';
import QuickActions from '../features/home/QuickActions';

export default function HomePage() {
  const { user, loading } = useAuth();
  // Wait for auth to resolve so we don't flash the marketing hero before
  // swapping to the signed-in launchpad. Each branch owns its own data hooks.
  if (loading) return <HomeLoading />;
  return user ? <SignedInHome userId={user.id} /> : <SignedOutHome />;
}

/* ------------------------------------------------------------------ */
/* Signed out — marketing split hero + live games rail                */
/* ------------------------------------------------------------------ */

function SignedOutHome() {
  const { sessions, loading, error } = useUpcomingSessions();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold tracking-[0.4em] text-[var(--color-hardwood)] uppercase">
            Pickup, organized.
          </p>
          <h1 className="font-display text-7xl leading-[0.86] tracking-tight text-[var(--color-court)] uppercase md:text-8xl">
            Find your
            <br />
            next run.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--color-ink)]/80">
            Find a court near you, RSVP to a game, and show up knowing exactly who's running with
            you. Sessions cap at 15 — first come, first hooped.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-[var(--color-court)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--color-court)]/30 transition hover:scale-[1.02] hover:bg-[var(--color-court)]/90"
            >
              Create an account
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-[var(--color-ink)]/20 px-6 py-3 font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
            >
              Sign in
            </Link>
          </div>
          <StatsStrip sessions={sessions} />
        </div>
        <GamesNearbyRail
          sessions={sessions}
          loading={loading}
          error={error}
          heading="Games near you"
        />
      </div>
    </main>
  );
}

/** Three honest, live counts derived from the already-fetched session list.
 *  Hidden entirely when there's nothing on the board yet. */
function StatsStrip({ sessions }: { sessions: UpcomingSession[] }) {
  const now = useNow();
  const { hooping, today, week } = useMemo(() => {
    let hooping = 0;
    let today = 0;
    let week = 0;
    for (const { session } of sessions) {
      const status = getSessionStatus(session, now);
      if (status === 'active') {
        hooping += 1;
        today += 1;
        week += 1;
      } else if (status === 'upcoming') {
        if (isWithinTimeWindow(session.starts_at, 'today', now)) today += 1;
        if (isWithinTimeWindow(session.starts_at, 'week', now)) week += 1;
      }
    }
    return { hooping, today, week };
  }, [sessions, now]);

  if (week === 0) return null;

  const items: [number, string][] = [
    [hooping, 'Hooping now'],
    [today, 'Games today'],
    [week, 'This week'],
  ];

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-dashed border-[var(--color-ink)]/15 pt-6">
      {items.map(([n, label]) => (
        <div key={label}>
          <div className="font-display text-4xl leading-none text-[var(--color-court)]">{n}</div>
          <div className="mt-1 text-[11px] font-bold tracking-[0.1em] text-[var(--color-ink)]/55 uppercase">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Signed in — personalized launchpad                                 */
/* ------------------------------------------------------------------ */

function SignedInHome({ userId }: { userId: string }) {
  const { profile } = useProfile(userId);
  const { sessions, loading, error } = useUpcomingSessions();
  const { entries } = useUserActiveSessions(userId);

  const nextEntry = entries[0] ?? null;
  const name = profile?.username
    ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1)
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        {/* Greeting + your next game */}
        <div className="order-1 md:col-start-1 md:row-start-1">
          <p className="text-lg font-bold tracking-wide text-[var(--color-ink)]/60">
            Welcome back
            {name ? (
              <>
                , <span className="text-[var(--color-court)]">{name}</span>
              </>
            ) : null}{' '}
            👋
          </p>
          <h1 className="mt-2 mb-5 font-display text-6xl leading-[0.9] tracking-tight text-[var(--color-ink)] uppercase md:text-7xl">
            Your next run
          </h1>
          {nextEntry ? <NextGameCard entry={nextEntry} /> : <EmptyNextRun />}
        </div>

        {/* Live games rail — right on desktop (explicit grid placement overrides
            the mobile `order`), last on mobile */}
        <div className="order-3 md:col-start-2 md:row-start-1">
          <GamesNearbyRail
            sessions={sessions}
            loading={loading}
            error={error}
            heading="More games near you"
            excludeSessionId={nextEntry?.session.id ?? null}
          />
        </div>

        {/* Quick actions — full-width bottom on desktop, above the rail on mobile */}
        <div className="order-2 md:col-span-2 md:col-start-1 md:row-start-2">
          <QuickActions />
        </div>
      </div>
    </main>
  );
}

function EmptyNextRun() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-ink)]/25 bg-[var(--color-ink)]/2 p-6 text-center">
      <p className="text-2xl" aria-hidden>
        🏀
      </p>
      <p className="mt-2 text-sm text-[var(--color-ink)]/70">
        <span className="font-bold text-[var(--color-ink)]">You're not in any games yet.</span>
        <br />
        Find one near you or host your own.
      </p>
      <Link
        to="/map"
        className="mt-4 inline-block rounded-full bg-[var(--color-court)] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90"
      >
        Find a court
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HomeLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="h-72 animate-pulse rounded-2xl bg-[var(--color-ink)]/3" />
        <div className="h-72 animate-pulse rounded-2xl bg-[var(--color-ink)]/3" />
      </div>
    </main>
  );
}
