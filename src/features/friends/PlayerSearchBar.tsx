import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { useProfileSearch } from './useProfileSearch';
import PlayerSearchResults from './PlayerSearchResults';
import PlayerIcon from '../../components/PlayerIcon';

/** Fixed dropdown width (px). The input itself is narrower (`w-60`); the panel
 *  is a touch wider so result rows + the friend button breathe. */
const DROPDOWN_WIDTH = 360;
const VIEWPORT_GAP = 8;

type Coords = { top: number; left: number };

/**
 * Desktop-only player search: a real search input in the navbar (left of Map)
 * whose results drop as a dropdown anchored directly under it — no centered
 * modal. The mobile surface stays the full-screen `PlayerSearchOverlay`.
 *
 * The dropdown is portaled to <body> and `position: fixed`, measured from the
 * input's bounding rect, for the same reasons as `NotificationsPanel`: the
 * header's backdrop-blur clamps fixed descendants, and on /map it must paint
 * above the Leaflet panes/controls (z-index up to ~1000) — hence `z-[2000]`.
 *
 * Non-modal popup (no focus trap): focus stays in the input; the dropdown
 * closes on Escape, an outside click, or navigating to a result.
 */
export default function PlayerSearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  const debounced = useDebouncedValue(query, 250);
  const { results, loading, error } = useProfileSearch(debounced);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Anchor the dropdown under the input; keep it pinned on scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    function reposition() {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const maxLeft = window.innerWidth - DROPDOWN_WIDTH - VIEWPORT_GAP;
      const left = Math.max(VIEWPORT_GAP, Math.min(r.left, maxLeft));
      setCoords({ top: r.bottom + 6, left });
    }
    reposition();
    window.addEventListener('resize', reposition);
    // capture so we catch scrolls on any ancestor, not just the window
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  // Escape + outside-click dismiss (the input and the portaled dropdown are
  // separate DOM subtrees, so check both).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  function handleNavigate() {
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={wrapRef} className="relative">
      <PlayerIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-bone)]/40" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Find players"
        aria-label="Search players by username"
        role="combobox"
        aria-expanded={open}
        aria-controls="player-search-dropdown"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className="w-60 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-bone)] outline-none placeholder:text-[var(--color-bone)]/40 focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30"
      />

      {open && coords
        ? createPortal(
            <div
              id="player-search-dropdown"
              ref={dropdownRef}
              role="listbox"
              style={{ top: coords.top, left: coords.left, width: DROPDOWN_WIDTH }}
              className="fixed z-[2000] max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--color-night-2)] p-2 shadow-2xl"
            >
              <PlayerSearchResults
                query={query}
                results={results}
                loading={loading}
                error={error}
                onNavigate={handleNavigate}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
