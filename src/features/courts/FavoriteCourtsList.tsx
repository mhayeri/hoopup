import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavoriteCourts } from './useFavoriteCourts';
import FavoriteCourtListItem from './FavoriteCourtListItem';
import RemoveFavoriteCourtModal from './RemoveFavoriteCourtModal';

type Props = {
  userId: string;
};

/**
 * Profile "Favorites" tab content — the signed-in user's saved courts. Rendered
 * self-only (favorites are private; the public profile route omits this tab).
 */
export default function FavoriteCourtsList({ userId }: Props) {
  const { favorites, loading, error, remove } = useFavoriteCourts(userId);
  // The court awaiting remove-confirmation. The modal lives here (not in the row)
  // so it stays mounted through the optimistic remove — on a failed delete the
  // row reappears and the modal can still surface the error.
  const [pending, setPending] = useState<{ courtId: number; name: string } | null>(null);

  if (loading) {
    return (
      <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-hardwood)]">Loading…</p>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        {error}
      </p>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-[var(--color-ink)]/70">
          No saved courts yet. Tap the star on any court to save it here.
        </p>
        <Link
          to="/map"
          className="rounded-full border border-[var(--color-ink)]/20 px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
        >
          Open map
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {favorites.map((favorite) => (
          <li key={favorite.court_id}>
            <FavoriteCourtListItem
              favorite={favorite}
              onRequestRemove={(courtId, name) => setPending({ courtId, name })}
            />
          </li>
        ))}
      </ul>
      <RemoveFavoriteCourtModal
        open={pending !== null}
        onClose={() => setPending(null)}
        courtName={pending?.name ?? ''}
        onConfirm={() => (pending ? remove(pending.courtId) : Promise.resolve({ error: null }))}
      />
    </>
  );
}
