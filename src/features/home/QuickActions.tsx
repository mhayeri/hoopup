import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type Tile = {
  to: string;
  icon: ReactNode;
  label: string;
  hint: string;
  /** The one primary action (Host a game) gets the volt accent. */
  primary?: boolean;
};

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const TILES: Tile[] = [
  {
    to: '/map',
    label: 'Host a game',
    hint: 'Put a run on the board',
    primary: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...STROKE} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8.5v7M8.5 12h7" />
      </svg>
    ),
  },
  {
    to: '/map',
    label: 'Find a court',
    hint: 'Every court on the map',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...STROKE} aria-hidden>
        <path d="M12 21s-6.5-5.4-6.5-10.2a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21Z" />
        <circle cx="12" cy="10.6" r="2.3" />
      </svg>
    ),
  },
  {
    to: '/profile?tab=friends',
    label: 'Friends',
    hint: 'Your crew, your invites',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...STROKE} aria-hidden>
        <circle cx="9" cy="8.5" r="3.2" />
        <path d="M3.5 19.5c.7-3.2 2.9-4.8 5.5-4.8s4.8 1.6 5.5 4.8" />
        <path d="M15.5 5.7a3.2 3.2 0 1 1 1.3 6.2M17.4 14.9c1.9.5 3.2 1.9 3.6 4.1" />
      </svg>
    ),
  },
  {
    to: '/profile?tab=favorites',
    label: 'Saved courts',
    hint: 'Home floors on file',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...STROKE} aria-hidden>
        <path d="m12 3.4 2.6 5.3 5.9.9-4.2 4.1 1 5.9-5.3-2.8-5.3 2.8 1-5.9L3.5 9.6l5.9-.9L12 3.4Z" />
      </svg>
    ),
  },
];

/**
 * The "Jump back in" launchpad — shortcut tiles into the core flows, below the
 * signed-in hero. "Host a game" carries the volt accent as the primary action.
 * Static navigation, no data fetching.
 */
export default function QuickActions() {
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-mono text-[11px] font-semibold tracking-[0.26em] text-[var(--color-bone)]/45 uppercase">
        Jump back in
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className={`group flex flex-col gap-7 rounded-2xl border p-4 backdrop-blur transition hover:-translate-y-0.5 active:scale-[0.99] ${
              tile.primary
                ? 'border-[var(--color-volt)]/40 bg-[var(--color-volt)]/8 text-[var(--volt-text)] hover:border-[var(--color-volt)]/80 hover:bg-[var(--color-volt)]/12'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--color-bone)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {tile.icon}
            <span>
              <span className="flex items-center justify-between gap-2 text-sm font-bold">
                {tile.label}
                <span
                  aria-hidden
                  className="translate-x-0 opacity-40 transition group-hover:translate-x-1 group-hover:opacity-100"
                >
                  →
                </span>
              </span>
              <span
                className={`mt-0.5 block text-xs ${tile.primary ? 'text-[var(--volt-text)]/60' : 'text-[var(--color-bone)]/45'}`}
              >
                {tile.hint}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
