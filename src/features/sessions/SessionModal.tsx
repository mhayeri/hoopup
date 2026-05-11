import { useEffect, useRef } from 'react';
import SessionForm, { type SessionFormValues } from './SessionForm';

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

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeRef.current();
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/40 px-4 py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-ink)]/10 bg-[var(--color-chalk)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-court)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-[var(--color-ink)]/60 hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]"
          >
            ✕
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
