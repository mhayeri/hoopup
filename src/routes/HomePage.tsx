import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { useProfile } from '../features/profiles/useProfile';
import { useUpcomingSessions, type UpcomingSession } from '../features/map/useUpcomingSessions';
import { useUserActiveSessions } from '../features/sessions/useUserActiveSessions';
import {
  getSessionStatus,
  isWithinTimeWindow,
  formatPanelTime,
} from '../features/sessions/formatTime';
import { useNow } from '../lib/useNow';
import CourtGL from '../components/CourtGL';
import Reveal from '../components/Reveal';
import CountUp from '../components/CountUp';
import Marquee from '../components/Marquee';
import TiltCard from '../components/TiltCard';
import GamesNearbyRail from '../features/home/GamesNearbyRail';
import HomeSessionCard from '../features/home/HomeSessionCard';
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
/* Signed out — floodlit hero + scroll story                           */
/* ------------------------------------------------------------------ */

function SignedOutHome() {
  const { sessions, loading, error } = useUpcomingSessions();

  return (
    <main className="relative overflow-hidden bg-[var(--color-night)] text-[var(--color-bone)]">
      <Hero sessions={sessions} />
      <TickerStrip sessions={sessions} />
      <HowItWorks />
      <GamesBoard sessions={sessions} loading={loading} error={error} />
      <FinalCta />
    </main>
  );
}

function Hero({ sessions }: { sessions: UpcomingSession[] }) {
  return (
    <section className="relative flex min-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
      {/* CSS floods paint first (and are the no-WebGL fallback); the canvas
          draws the full scene over them. */}
      <div aria-hidden className="volt-floods absolute inset-0" />
      <CourtGL variant="hero" className="absolute inset-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-6 pb-24 md:justify-center md:pb-28">
        <Reveal>
          <p className="mb-5 flex items-center gap-2.5 font-mono text-xs font-semibold tracking-[0.34em] text-[var(--volt-text)] uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-volt)] shadow-[0_0_10px_var(--color-volt)]" />
            Pickup, organized
          </p>
        </Reveal>
        <h1 className="font-display text-[clamp(4rem,13vw,10.5rem)] leading-[0.84] font-black tracking-tight uppercase">
          <Reveal as="span" className="block">
            Find your
          </Reveal>
          <Reveal as="span" delay={110} className="volt-glow block text-[var(--color-volt)]">
            next run.
          </Reveal>
        </h1>
        <Reveal delay={220}>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-[var(--color-bone)]/65">
            Find a court near you, RSVP to a game, and show up knowing exactly who's running with
            you. Sessions cap at 15. First come, first hooped.
          </p>
        </Reveal>
        <Reveal delay={330}>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="sheen rounded-full bg-[var(--color-volt)] px-7 py-3.5 font-semibold text-[#0c1402] shadow-[0_0_32px_rgba(200,255,45,0.35)] transition hover:scale-[1.03] active:scale-[0.98]"
            >
              Create an account
            </Link>
            <Link
              to="/map"
              className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-7 py-3.5 font-semibold text-[var(--color-bone)] backdrop-blur transition hover:border-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 active:scale-[0.98]"
            >
              Browse courts
            </Link>
          </div>
        </Reveal>
        <StatsStrip sessions={sessions} />
      </div>

      <div
        aria-hidden
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--color-bone)]/35 uppercase">
          Scroll
        </span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-[var(--color-volt)]/70 to-transparent" />
      </div>
    </section>
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
    <Reveal delay={440}>
      <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-dashed border-[var(--border)] pt-6">
        {items.map(([n, label]) => (
          <div key={label}>
            <div className="volt-glow font-mono text-4xl font-semibold text-[var(--volt-text)] tabular-nums">
              <CountUp value={n} />
            </div>
            <div className="mt-1.5 font-mono text-[10px] font-semibold tracking-[0.22em] text-[var(--color-bone)]/45 uppercase">
              {label}
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/** Broadcast-style ticker between the hero and the story sections. Shows real
 *  upcoming games when the board has any; evergreen court-culture lines when
 *  it doesn't. */
function TickerStrip({ sessions }: { sessions: UpcomingSession[] }) {
  const now = useNow();
  const items = useMemo(() => {
    const live = sessions
      .filter(({ session }) => {
        const s = getSessionStatus(session, now);
        return s === 'active' || s === 'upcoming';
      })
      .slice(0, 8)
      .map(({ session, court }) => {
        const name = court?.name ?? 'Basketball court';
        return getSessionStatus(session, now) === 'active'
          ? `Hooping now · ${name}`
          : `${formatPanelTime(session.starts_at, now)} · ${name}`;
      });
    return live.length > 0
      ? live
      : [
          'Find a court',
          'Call next',
          '15 on the list',
          'First come, first hooped',
          'Every public court on the map',
          'Winners stay',
        ];
  }, [sessions, now]);

  return (
    <div className="border-y border-[var(--border)] bg-[var(--color-night-2)]/60 py-3.5">
      <Marquee duration={40}>
        {items.map((text, i) => (
          <span
            key={`${text}-${i}`}
            className="flex items-center font-mono text-xs font-semibold tracking-[0.24em] whitespace-nowrap text-[var(--color-bone)]/55 uppercase"
          >
            <span className="mx-7 h-1.5 w-1.5 rounded-full bg-[var(--color-volt)]/70" aria-hidden />
            {text}
          </span>
        ))}
      </Marquee>
    </div>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'Scout the map',
    copy: 'Every public court, pulled live from OpenStreetMap. Filter games by tip-off time, open spots, or the host’s skill level.',
  },
  {
    n: '02',
    title: 'Lock your spot',
    copy: 'RSVP in one tap. Games cap at 15 — first ten take the floor, next five hold the bench, everyone else waits in line.',
  },
  {
    n: '03',
    title: 'Pull up & hoop',
    copy: 'See exactly who’s running before you leave the house — skill, position, years playing. No group-chat chaos.',
  },
] as const;

function HowItWorks() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
      <Reveal>
        <p className="font-mono text-xs font-semibold tracking-[0.34em] text-[var(--color-blue)] uppercase">
          How it works
        </p>
      </Reveal>
      <div className="mt-10 flex flex-col gap-16 md:gap-20">
        {STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 90}>
            <div
              className={`grid items-center gap-4 border-t border-[var(--border)] pt-8 md:grid-cols-12 md:gap-8 ${
                i % 2 === 1 ? 'md:text-right' : ''
              }`}
            >
              <p
                aria-hidden
                className={`text-outline font-display text-[clamp(5rem,10vw,9rem)] leading-[0.8] font-black select-none ${
                  i % 2 === 1 ? 'md:order-2 md:col-span-4' : 'md:col-span-4'
                }`}
              >
                {step.n}
              </p>
              <div
                className={`md:col-span-7 ${i % 2 === 1 ? 'md:order-1 md:col-start-1' : 'md:col-start-6'}`}
              >
                <h3 className="font-display text-4xl font-extrabold tracking-wide uppercase md:text-5xl">
                  {step.title}
                </h3>
                <p
                  className={`mt-3 max-w-md text-base leading-relaxed text-[var(--color-bone)]/60 ${
                    i % 2 === 1 ? 'md:ml-auto' : ''
                  }`}
                >
                  {step.copy}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Most games shown on the signed-out board before "see all". */
const BOARD_MAX = 6;

function GamesBoard({
  sessions,
  loading,
  error,
}: {
  sessions: UpcomingSession[];
  loading: boolean;
  error: string | null;
}) {
  const now = useNow();
  const visible = useMemo(() => {
    const live: UpcomingSession[] = [];
    const upcoming: UpcomingSession[] = [];
    for (const entry of sessions) {
      const status = getSessionStatus(entry.session, now);
      if (status === 'active') live.push(entry);
      else if (status === 'upcoming') upcoming.push(entry);
    }
    return [...live, ...upcoming].slice(0, BOARD_MAX).map((entry) => ({
      entry,
      live: getSessionStatus(entry.session, now) === 'active',
    }));
  }, [sessions, now]);

  return (
    <section className="relative border-t border-[var(--border)] bg-[var(--color-night-2)]/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-semibold tracking-[0.34em] text-[var(--volt-text)] uppercase">
                Live board
              </p>
              <h2 className="mt-2 font-display text-6xl font-black tracking-wide uppercase md:text-7xl">
                On the board
              </h2>
            </div>
            <Link
              to="/map"
              className="group mb-2 inline-flex items-center gap-2 font-mono text-sm font-semibold tracking-wide text-[var(--color-bone)]/70 uppercase transition hover:text-[var(--volt-text)]"
            >
              See all on the map
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </Reveal>

        <div className="mt-10">
          {loading && sessions.length === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                />
              ))}
            </div>
          ) : error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          ) : visible.length === 0 ? (
            <Reveal>
              <div className="rounded-3xl border border-dashed border-[var(--border-strong)] px-6 py-16 text-center">
                <p
                  aria-hidden
                  className="text-outline font-display text-5xl font-black tracking-wide uppercase opacity-70 md:text-7xl"
                >
                  Empty court
                </p>
                <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-bone)]/55">
                  No games on the board yet. Grab a court on the map and be the first to put one up.
                </p>
                <Link
                  to="/map"
                  className="sheen mt-7 inline-block rounded-full bg-[var(--color-volt)] px-6 py-3 text-sm font-semibold text-[#0c1402] shadow-[0_0_26px_rgba(200,255,45,0.3)] transition hover:scale-[1.03] active:scale-[0.98]"
                >
                  Host the first game
                </Link>
              </div>
            </Reveal>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visible.map(({ entry, live }, i) => (
                <Reveal key={entry.session.id} delay={(i % 2) * 90}>
                  <HomeSessionCard entry={entry} now={now} live={live} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--border)]">
      <div aria-hidden className="volt-floods absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-6 py-28 text-center md:py-36">
        <Reveal>
          <h2 className="font-display text-[clamp(4rem,12vw,9.5rem)] leading-[0.85] font-black tracking-tight uppercase">
            Got <span className="volt-glow text-[var(--color-volt)]">next?</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-[var(--color-bone)]/60">
            It takes a minute to make an account and about ten seconds to join a run.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="sheen rounded-full bg-[var(--color-volt)] px-8 py-4 font-semibold text-[#0c1402] shadow-[0_0_36px_rgba(200,255,45,0.4)] transition hover:scale-[1.03] active:scale-[0.98]"
            >
              Create an account
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-[var(--border-strong)] px-8 py-4 font-semibold text-[var(--color-bone)] transition hover:border-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 active:scale-[0.98]"
            >
              Sign in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Signed in — personalized launchpad                                  */
/* ------------------------------------------------------------------ */

function SignedInHome({ userId }: { userId: string }) {
  const { profile } = useProfile(userId);
  const { sessions, loading, error } = useUpcomingSessions();
  const { entries } = useUserActiveSessions(userId);

  const nextEntry = entries[0] ?? null;
  const name = profile?.username ?? null;

  return (
    <main className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden bg-[var(--color-night)] text-[var(--color-bone)]">
      <div aria-hidden className="volt-floods absolute inset-0" />
      <CourtGL variant="ambient" className="absolute inset-0" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:py-16">
        <Reveal>
          <p className="flex items-center gap-2.5 font-mono text-xs font-semibold tracking-[0.3em] text-[var(--volt-text)] uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-volt)] shadow-[0_0_10px_var(--color-volt)]" />
            Welcome back{name ? `, ${name}` : ''}
          </p>
        </Reveal>
        <Reveal delay={90}>
          <h1 className="mt-3 mb-8 font-display text-7xl leading-[0.86] font-black tracking-tight uppercase md:text-8xl">
            Your next run
          </h1>
        </Reveal>

        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <Reveal delay={160} className="order-1 md:col-start-1 md:row-start-1">
            {nextEntry ? (
              <TiltCard spotColor="rgba(200,255,45,0.5)">
                <NextGameCard entry={nextEntry} />
              </TiltCard>
            ) : (
              <EmptyNextRun />
            )}
          </Reveal>

          {/* Live games rail: right on desktop (explicit grid placement overrides
              the mobile `order`), last on mobile */}
          <Reveal delay={230} className="order-3 md:col-start-2 md:row-start-1">
            <GamesNearbyRail
              sessions={sessions}
              loading={loading}
              error={error}
              heading="More games near you"
              excludeSessionId={nextEntry?.session.id ?? null}
            />
          </Reveal>

          {/* Quick actions: full-width bottom on desktop, above the rail on mobile */}
          <Reveal delay={300} className="order-2 md:col-span-2 md:col-start-1 md:row-start-2">
            <QuickActions />
          </Reveal>
        </div>
      </div>
    </main>
  );
}

function EmptyNextRun() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center">
      <p
        aria-hidden
        className="text-outline font-display text-4xl font-black tracking-wide uppercase opacity-80 md:text-5xl"
      >
        No games yet
      </p>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[var(--color-bone)]/60">
        You're not on any rosters right now. Find a run near you or put your own on the board.
      </p>
      <Link
        to="/map"
        className="sheen mt-6 inline-block rounded-full bg-[var(--color-volt)] px-6 py-2.5 text-sm font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:scale-[1.03] active:scale-[0.98]"
      >
        Find a court
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HomeLoading() {
  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr]">
        <div className="h-72 animate-pulse rounded-3xl bg-[var(--surface-2)]" />
        <div className="h-72 animate-pulse rounded-3xl bg-[var(--surface-2)]" />
      </div>
    </main>
  );
}
