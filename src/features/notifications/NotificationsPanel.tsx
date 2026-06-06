import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNow } from '../../lib/useNow';
import type { NotificationWithActor } from '../../lib/database.types';
import NotificationItem from './NotificationItem';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
  notifications: NotificationWithActor[];
  loading: boolean;
  error: string | null;
  markAllRead: () => void;
  remove: (id: string) => void;
};

/**
 * Notifications dropdown. Full-screen sheet on mobile, a panel pinned under the
 * navbar on the right on desktop. Reuses PlayerSearchOverlay's a11y contract
 * (Escape, focus trap, body-scroll lock, focus restore) and the same portal +
 * z-[2000] rationale (the header's backdrop-blur clamps fixed descendants, and
 * the panel can open over the Leaflet map). Marks everything read on open.
 */
export default function NotificationsPanel({
  open,
  onClose,
  notifications,
  loading,
  error,
  markAllRead,
  remove,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const triggerEl = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

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

  // Mark all read once per open (the deps intentionally exclude markAllRead so
  // it fires on the open transition, not on every render).
  const markAllReadRef = useRef(markAllRead);
  markAllReadRef.current = markAllRead;
  useEffect(() => {
    if (open) markAllReadRef.current();
  }, [open]);

  const now = useNow();

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      className="fixed inset-0 z-[2000] flex flex-col bg-[var(--color-night-2)] sm:block sm:bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="flex h-full w-full flex-col overflow-hidden bg-[var(--color-night-2)] sm:absolute sm:right-4 sm:top-16 sm:h-auto sm:max-h-[70vh] sm:w-96 sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-[var(--color-bone)]">
            Notifications
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-[var(--color-bone)]/60 hover:bg-white/8 hover:text-[var(--color-bone)]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--color-bone)]/55">Loading…</p>
          ) : error ? (
            <p className="px-4 py-10 text-center text-sm text-red-300">{error}</p>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[var(--color-bone)]/55">
                You&rsquo;re all caught up. When a friend hosts a game or adds you, it shows up
                here.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  now={now}
                  onNavigate={onClose}
                  onRemove={remove}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
