import { Link } from 'react-router-dom';

type Tile = {
  to: string;
  icon: string;
  label: string;
  desc: string;
};

const TILES: Tile[] = [
  { to: '/map', icon: '📍', label: 'Find a court', desc: 'Browse the map' },
  { to: '/map', icon: '＋', label: 'Host a game', desc: 'Pick a court & time' },
  { to: '/profile?tab=friends', icon: '👥', label: 'Friends', desc: 'See your players' },
  { to: '/profile?tab=favorites', icon: '★', label: 'Saved courts', desc: 'Your favorites' },
];

/**
 * The "Jump back in" launchpad strip — quick links into the core flows. Static
 * navigation shortcuts; lives below the signed-in hero (full width on desktop,
 * a 2×2 grid on mobile).
 */
export default function QuickActions() {
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-display text-2xl tracking-wide text-[var(--color-ink)]">
        Jump back in
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TILES.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className="flex flex-col gap-1.5 rounded-2xl border border-[var(--color-ink)]/10 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:border-[var(--color-court)]/40"
          >
            <span className="text-2xl leading-none" aria-hidden>
              {tile.icon}
            </span>
            <span className="text-sm font-bold text-[var(--color-ink)]">{tile.label}</span>
            <span className="text-xs text-[var(--color-ink)]/55">{tile.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
