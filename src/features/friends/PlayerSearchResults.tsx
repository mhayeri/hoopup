import { MIN_QUERY_LENGTH } from './useProfileSearch';
import PlayerSearchResult from './PlayerSearchResult';
import type { PublicProfileRow } from '../profiles/useProfileByUsername';

type Props = {
  /** The raw (un-debounced) query — drives the too-short / empty copy. */
  query: string;
  results: PublicProfileRow[];
  loading: boolean;
  error: string | null;
  /** Called when a result's username link is clicked, so the host surface
   *  (overlay or dropdown) can close before the route changes. */
  onNavigate: () => void;
};

/**
 * Shared results body for the player search surfaces: the desktop navbar
 * dropdown (`PlayerSearchBar`) and the mobile full-screen sheet
 * (`PlayerSearchOverlay`). Renders the too-short / loading / error / empty
 * states and the list of `PlayerSearchResult` rows. State-only; the search
 * itself lives in `useProfileSearch`.
 */
export default function PlayerSearchResults({ query, results, loading, error, onNavigate }: Props) {
  const trimmed = query.trim();

  if (trimmed.length < MIN_QUERY_LENGTH) {
    return (
      <p className="px-1 py-6 text-center text-sm text-[var(--color-bone)]/55">
        Search players by username to add them as friends.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="px-1 py-6 text-center text-sm text-[var(--color-bone)]/55">Searching...</p>
    );
  }

  if (error) {
    return <p className="px-1 py-6 text-center text-sm text-red-300">{error}</p>;
  }

  if (results.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-[var(--color-bone)]/55">
        No players found for &quot;{trimmed}&quot;.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {results.map((profile) => (
        <PlayerSearchResult key={profile.id} profile={profile} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}
