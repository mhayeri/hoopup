import { Link } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import BallMark from './BallMark';

const REPO_URL = 'https://github.com/mhayeri/hoopup';

/**
 * App-wide footer (hidden on /map, which owns the full viewport). Ends every
 * page with navigation instead of a dead stop; the giant outlined wordmark
 * bleeding off the bottom edge is the closing brand beat.
 */
export default function SiteFooter() {
  const { session } = useAuth();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)] bg-[var(--color-night)] text-[var(--color-bone)]">
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-14 pb-10">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <BallMark className="h-6 w-6 text-[var(--color-volt)]" />
              <span className="font-display text-3xl font-black tracking-wide uppercase">
                Hoop<span className="text-[var(--color-volt)]">Up</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--color-bone)]/55">
              Pickup basketball, organized. Find a court, pick a time, get on the floor.
            </p>
            <p className="mt-4 text-xs text-[var(--color-bone)]/40">
              Court data ©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-[var(--border-strong)] underline-offset-2 transition hover:text-[var(--color-bone)]/70"
              >
                OpenStreetMap
              </a>{' '}
              contributors
            </p>
          </div>

          <FooterCol
            title="Play"
            links={[
              { label: 'Find a game', to: '/map' },
              { label: 'Host a game', to: '/map' },
              session
                ? { label: 'Your profile', to: '/profile' }
                : { label: 'Create an account', to: '/signup' },
            ]}
          />
          <FooterCol
            title="Site"
            links={[
              { label: 'GitHub', href: REPO_URL },
              { label: 'Report an issue', href: `${REPO_URL}/issues` },
              session
                ? { label: 'Settings', to: '/profile?tab=settings' }
                : { label: 'Sign in', to: '/login' },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--color-bone)]/40">
          <p>© 2026 HoopUp</p>
          <p className="font-mono tracking-wide uppercase">Built for the love of the game</p>
        </div>
      </div>

      {/* Giant outlined wordmark bleeding off the bottom edge. */}
      <p
        aria-hidden
        className="text-outline pointer-events-none relative z-0 -mt-6 -mb-[0.32em] text-center font-display text-[clamp(6rem,19vw,17rem)] leading-none font-black tracking-wide uppercase opacity-60 select-none"
      >
        HoopUp
      </p>
    </footer>
  );
}

type FooterLink = { label: string; to?: string; href?: string };

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-[var(--color-bone)]/40 uppercase">
        {title}
      </p>
      <ul className="mt-4 flex flex-col gap-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            {l.to ? (
              <Link
                to={l.to}
                className="text-[var(--color-bone)]/70 transition hover:text-[var(--color-volt)]"
              >
                {l.label}
              </Link>
            ) : (
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-bone)]/70 transition hover:text-[var(--color-volt)]"
              >
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
