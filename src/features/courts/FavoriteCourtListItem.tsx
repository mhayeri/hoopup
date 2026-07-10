import { Link } from 'react-router-dom';
import type { FavoriteCourtRow } from '../../lib/database.types';
import { useCourtAddress } from '../map/useCourtAddress';

type Props = {
  favorite: FavoriteCourtRow;
  onRequestRemove: (courtId: number, courtName: string) => void;
};

/** One saved court: links to the court detail page; the ★ button asks to un-save it. */
export default function FavoriteCourtListItem({ favorite, onRequestRemove }: Props) {
  const court = favorite.court;
  const name = useCourtAddress(court);

  const facts = [
    court?.surface ?? null,
    court?.hoops ? `${court.hoops} hoops` : null,
    court?.lit ? 'Lit' : null,
  ]
    .filter((f): f is string => f !== null)
    .join(' · ');

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <Link
        to={`/courts/${favorite.court_id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-80"
      >
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--color-night-3)] text-lg"
        >
          🏀
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-[var(--color-bone)]">{name}</span>
          {facts ? (
            <span className="mt-0.5 block truncate text-xs text-[var(--color-bone)]/55">
              {facts}
            </span>
          ) : null}
        </span>
      </Link>
      <button
        type="button"
        onClick={() => onRequestRemove(favorite.court_id, name)}
        aria-label={`Remove ${name} from favorites`}
        title="Remove from favorites"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-volt)]/30 bg-[var(--color-volt)]/10 text-[var(--volt-text)] transition hover:bg-[var(--color-volt)]/20"
      >
        ★
      </button>
    </div>
  );
}
