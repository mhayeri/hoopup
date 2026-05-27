import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const itemClass =
  'w-full rounded-lg px-3 py-3 text-left text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5';

type Props = {
  open: boolean;
  onClose: () => void;
  authed: boolean;
  onSignOut: () => void;
  onOpenSearch: () => void;
};

/**
 * Mobile-only nav menu: a dropdown that drops under the sticky header and dims
 * the page below it. Shown only under `sm` (CSS `sm:hidden`); the desktop nav
 * cluster lives in NavBar.
 *
 * Portaled to <body> for the same reasons as PlayerSearchOverlay: the NavBar's
 * <header> uses backdrop-blur (which clamps `position: fixed` descendants), and
 * on /map the menu must paint above Leaflet panes/controls (z-index up to
 * ~1000) — hence `z-[2000]`.
 *
 * The container is `pointer-events-none` with `pointer-events-auto` children, so
 * the top strip over the real header stays click-through and the header's
 * hamburger (which toggles to ✕ at z-10) remains tappable to close.
 */
export default function MobileNavMenu({ open, onClose, authed, onSignOut, onOpenSearch }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const triggerEl = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeRef.current();
    }
    window.addEventListener('keydown', onKey);

    // Auto-close when the viewport grows to the desktop breakpoint, so the
    // CSS-hidden menu doesn't leave the body-scroll lock stuck on.
    const mql = window.matchMedia('(min-width: 640px)');
    function onChange() {
      if (mql.matches) closeRef.current();
    }
    mql.addEventListener('change', onChange);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      mql.removeEventListener('change', onChange);
      document.body.style.overflow = prevOverflow;
      triggerEl?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[2000] sm:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="pointer-events-auto absolute inset-x-0 bottom-0 top-14 w-full cursor-default bg-[var(--color-ink)]/30"
      />
      <div
        ref={panelRef}
        id="mobile-nav-menu"
        className="pointer-events-auto absolute inset-x-0 top-14 border-b border-[var(--color-ink)]/10 bg-[var(--color-chalk)] shadow-lg"
      >
        <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-3">
          <Link to="/map" onClick={onClose} className={itemClass}>
            Map
          </Link>
          {authed ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className={itemClass}
              >
                Find players
              </button>
              <Link to="/profile" onClick={onClose} className={itemClass}>
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="mt-1 w-full rounded-lg border border-[var(--color-ink)]/20 px-3 py-3 text-center text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={onClose} className={itemClass}>
                Sign in
              </Link>
              <Link
                to="/signup"
                onClick={onClose}
                className="mt-1 w-full rounded-lg bg-[var(--color-court)] px-3 py-3 text-center text-base font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>,
    document.body
  );
}
