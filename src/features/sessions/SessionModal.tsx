import { useEffect, useRef } from 'react';
import SessionForm, { type SessionFormValues } from './SessionForm';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  title: string;
  initial?: Partial<SessionFormValues>;
  submitLabel: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SessionFormValues) => Promise<{ error: string | null }>;
};

export default function SessionModal({
  title,
  initial,
  submitLabel,
  open,
  onClose,
  onSubmit,
}: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--color-night-2)] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-volt)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-[var(--color-bone)]/55 hover:bg-white/[0.06] hover:text-[var(--color-bone)]"
          >
            &#x2715;
          </button>
        </div>
        <SessionForm
          initial={initial}
          submitLabel={submitLabel}
          onSubmit={async (values) => {
            const result = await onSubmit(values);
            if (!result.error) onClose();
            return result;
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
