import { Link } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { useFavoriteCourt } from './useFavoriteCourt';

/**
 * Star pill that saves / un-saves a court for the signed-in user. Signed-out
 * viewers get a quiet "Sign in to save" link instead (mirrors the
 * "Sign in to host" affordance on the court detail page).
 */
export default function FavoriteCourtButton({ courtId }: { courtId: number }) {
  const { user } = useAuth();
  const { isFavorite, loading, pending, toggle } = useFavoriteCourt(courtId);

  if (!user) {
    return (
      <Link
        to="/login"
        className="text-sm font-semibold text-[var(--color-bone)]/45 underline underline-offset-4 transition hover:text-[var(--color-bone)]"
      >
        Sign in to save
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={loading || pending}
      aria-pressed={isFavorite}
      title={isFavorite ? 'Saved - tap to remove' : 'Save this court'}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
        isFavorite
          ? 'bg-[var(--color-volt)] text-[var(--on-volt)] shadow-[0_0_22px_var(--glow-cta)] hover:bg-[var(--color-volt)]/90'
          : 'border border-[var(--border-strong)] text-[var(--color-bone)] hover:bg-[var(--hover)]'
      }`}
    >
      <span aria-hidden className="text-base leading-none">
        {isFavorite ? '★' : '☆'}
      </span>
      {isFavorite ? 'Saved' : 'Save'}
    </button>
  );
}
