import { Link } from 'react-router-dom';

type Tile = {
  to: string;
  icon: string;
  label: string;
  /** The one primary action (Host a game) gets the volt accent. */
  primary?: boolean;
};

const TILES: Tile[] = [
  { to: '/map', icon: '＋', label: 'Host a game', primary: true },
  { to: '/map', icon: '📍', label: 'Find a court' },
  { to: '/profile?tab=friends', icon: '👥', label: 'Friends' },
  { to: '/profile?tab=favorites', icon: '★', label: 'Saved courts' },
];

/**
 * The "Jump back in" launchpad — a compact row of pill shortcuts into the core
 * flows, below the signed-in hero. "Host a game" carries the volt accent as the
 * primary action; the rest are neutral. Wraps to multiple lines on narrow
 * screens. Static navigation, no data fetching.
 */
export default function QuickActions() {
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-display text-2xl tracking-wide text-[var(--color-bone)]">
        Jump back in
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {TILES.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
              tile.primary
                ? 'border-[var(--color-volt)]/45 bg-[var(--color-volt)]/10 text-[var(--color-volt)] hover:bg-[var(--color-volt)]/15'
                : 'border-white/12 bg-white/[0.04] text-[var(--color-bone)] hover:border-white/25 hover:bg-white/[0.07]'
            }`}
          >
            <span className="text-base leading-none" aria-hidden>
              {tile.icon}
            </span>
            {tile.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
