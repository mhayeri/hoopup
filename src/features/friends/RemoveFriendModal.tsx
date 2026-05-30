import { useState } from 'react';
import Modal from '../../components/Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  username: string;
  onConfirm: () => Promise<{ error: string | null }>;
};

/**
 * Confirmation gate for removing an accepted friend. Decline-incoming and
 * cancel-sent-request stay one-click — only the destructive case (dropping an
 * established friendship) is wrapped here.
 */
export default function RemoveFriendModal({ open, onClose, username, onConfirm }: Props) {
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
    <Modal title="Remove friend?" open={open} onClose={handleClose}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-bone)]">
          Are you sure you want to remove <span className="font-semibold">@{username}</span> from
          your friends?
        </p>
        <p className="text-xs text-[var(--color-bone)]/55">
          You'll need to re-add them to become friends again.
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
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[var(--color-bone)]/70 transition hover:bg-white/8 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
