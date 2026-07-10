import { useEffect, useRef, type ReactNode } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ title, open, onClose, children }: Props) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const triggerEl = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusables?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeRef.current();
        return;
      }
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

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="glass w-full max-w-md rounded-3xl p-6 shadow-[0_40px_90px_-30px_var(--elev-shadow)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-3xl font-extrabold tracking-wide text-[var(--color-bone)] uppercase">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-[var(--color-bone)]/70 hover:bg-[var(--hover)] hover:text-[var(--color-bone)]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
