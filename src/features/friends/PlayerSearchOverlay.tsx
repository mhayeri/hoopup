import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { MIN_QUERY_LENGTH, useProfileSearch } from './useProfileSearch';
import PlayerSearchResult from './PlayerSearchResult';
import PlayerIcon from '../../components/PlayerIcon';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const searchInputClass =
  'w-full rounded-lg border border-white/15 bg-white/[0.04] py-2 pl-9 pr-3 text-[var(--color-bone)] outline-none placeholder:text-[var(--color-bone)]/40 focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30';

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Find-a-friend search dialog. Full-screen on mobile, centered panel on
 * desktop. Search-as-you-type (debounced) over usernames; each result carries
 * the morphing FriendActionButton so requests can be sent inline.
 *
 * Reuses Modal's a11y contract (autofocus, focus trap, Escape, body-scroll
 * lock, focus restore) but with a search-specific header + scrollable body.
 */
export default function PlayerSearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const { results, loading, error } = useProfileSearch(debounced);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const triggerEl = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeRef.current();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== 'Tab' || !panel) return;
      const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      triggerEl?.focus?.();
    };
  }, [open]);

  // Start fresh each time the overlay opens.
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!open) return null;

  const trimmed = query.trim();
  const tooShort = trimmed.length < MIN_QUERY_LENGTH;

  // Portal to <body>: the NavBar's <header> uses backdrop-blur, and a
  // backdrop-filter makes that element the containing block for `position:
  // fixed` descendants — which would clamp this overlay to the navbar's box
  // instead of the viewport. Rendering at body level escapes that.
  //
  // z-[2000] (below): the overlay can open over the Leaflet map, whose panes
  // and controls reach z-index 1000 and aren't confined to their own stacking
  // context — a plain z-50 renders behind the map tiles.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Find players"
      className="fixed inset-0 z-[2000] flex flex-col bg-[var(--color-night-2)] sm:bg-black/60 sm:p-4 sm:pt-16"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="flex h-full w-full flex-col overflow-hidden bg-[var(--color-night-2)] sm:mx-auto sm:h-auto sm:max-h-[80vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <div className="relative flex-1">
            <PlayerIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-bone)]/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players by username"
              aria-label="Search players by username"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className={searchInputClass}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-[var(--color-bone)]/60 hover:bg-white/8 hover:text-[var(--color-bone)]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tooShort ? (
            <p className="px-1 py-6 text-center text-sm text-[var(--color-bone)]/55">
              Search players by username to add them as friends.
            </p>
          ) : loading ? (
            <p className="px-1 py-6 text-center text-sm text-[var(--color-bone)]/55">
              Searching...
            </p>
          ) : error ? (
            <p className="px-1 py-6 text-center text-sm text-red-300">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-[var(--color-bone)]/55">
              No players found for &quot;{trimmed}&quot;.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((profile) => (
                <PlayerSearchResult key={profile.id} profile={profile} onNavigate={onClose} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
