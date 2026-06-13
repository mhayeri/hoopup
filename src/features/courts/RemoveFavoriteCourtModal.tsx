import { useState } from 'react';
import Modal from '../../components/Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  courtName: string;
  onConfirm: () => Promise<{ error: string | null }>;
};

/**
 * Confirmation gate for un-saving a court from the Favorites tab. The court-detail
 * page ★ stays a one-tap toggle — only the list-row remove is wrapped here so a
 * misclick can't silently drop a saved court.
 */
export default function RemoveFavoriteCourtModal({ open, onClose, courtName, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (busy) return;
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    const { error: err } = await onConfirm();
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <Modal title="Remove favorite?" open={open} onClose={handleClose}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-bone)]">
          Remove <span className="font-semibold">{courtName}</span> from your saved courts?
        </p>
        <p className="text-xs text-[var(--color-bone)]/70">
          You'll need to star it again to re-save.
        </p>

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-full border border-[var(--border-strong)] px-5 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--hover)] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className="rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
