import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const itemClass =
  'w-full rounded-lg px-3 py-3 text-left font-display text-3xl font-bold uppercase tracking-wide text-[var(--color-bone)] transition hover:bg-[var(--hover)] hover:text-[var(--color-volt)]';

type Props = {
  open: boolean;
  onClose: () => void;
  authed: boolean;
  onSignOut: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
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
export default function MobileNavMenu({
  open,
  onClose,
  authed,
  onSignOut,
  onOpenSearch,
  onOpenNotifications,
  unreadCount,
}: Props) {
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
        className="pointer-events-auto absolute inset-x-0 bottom-0 top-14 w-full cursor-default bg-black/50"
      />
      <div
        ref={panelRef}
        id="mobile-nav-menu"
        className="pointer-events-auto absolute inset-x-0 top-14 border-b border-[var(--border)] bg-[var(--color-night-2)] shadow-lg"
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
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotifications();
                }}
                className={`${itemClass} flex items-center justify-between`}
              >
                <span>Notifications</span>
                {unreadCount > 0 ? (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-volt)] px-1 text-[10px] font-extrabold leading-none text-[#0c1402]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
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
                className="mt-1 w-full rounded-lg border border-[var(--border-strong)] px-3 py-3 text-center text-base font-semibold text-[var(--color-bone)] hover:bg-[var(--hover)]"
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
                className="mt-1 w-full rounded-lg bg-[var(--color-volt)] px-3 py-3 text-center text-base font-semibold text-[#0c1402] shadow-[0_0_20px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90"
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
