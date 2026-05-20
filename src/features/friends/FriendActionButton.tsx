import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { useFriendshipWithUser } from './useFriendshipWithUser';
import RemoveFriendModal from './RemoveFriendModal';

type Variant = 'primary' | 'compact' | 'icon';

type Props = {
  otherUserId: string;
  /**
   * Username of the other user — shown in the remove-friend confirmation
   * modal. Required so we can render a recognisable "@name" in the prompt;
   * the `icon` variant never reaches the remove flow but still needs the
   * prop satisfied at the type level.
   */
  username: string;
  variant?: Variant;
};

/**
 * Morphing add-friend button. Reads the viewer ↔ otherUserId relationship and
 * renders the right control:
 *   none      → "+ Add friend"        (send request)
 *   outgoing  → "Request sent · Cancel"
 *   incoming  → [Accept] [Decline]
 *   friends   → "Friends ✓ ▾"         (menu → Remove)
 *   self      → nothing
 *
 * Unauthenticated viewers see a sign-in CTA that returns them after login.
 */
export default function FriendActionButton({
  otherUserId,
  username,
  variant = 'primary',
}: Props) {
  const { user } = useAuth();
  const { relation, loading, send, accept, decline, cancel, remove } =
    useFriendshipWithUser(otherUserId);
  const [busy, setBusy] = useState(false);
  const [removeMenuOpen, setRemoveMenuOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  // Close the Remove-friend menu on outside-click or Escape.
  useEffect(() => {
    if (!removeMenuOpen) return;
    function onDocPointer(e: MouseEvent) {
      if (
        menuWrapperRef.current &&
        e.target instanceof Node &&
        !menuWrapperRef.current.contains(e.target)
      ) {
        setRemoveMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setRemoveMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [removeMenuOpen]);

  if (relation.kind === 'self') return null;
  if (loading) return null;

  // Unauthenticated viewer — show a sign-in CTA in primary variant; hide on
  // the lighter variants (those surfaces are inside auth-gated flows already).
  if (!user) {
    if (variant !== 'primary') return null;
    return (
      <Link
        to="/login"
        className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:brightness-95"
      >
        Sign in to add friend
      </Link>
    );
  }

  async function run(fn: () => Promise<{ error: string | null }>) {
    setBusy(true);
    setError(null);
    const { error: err } = await fn();
    if (err) setError(err);
    setBusy(false);
  }

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (variant === 'icon') {
    // Used inside the map SessionCard host slot. Only shown for the
    // "stranger" state — once friended/pending it disappears to avoid
    // cluttering small cards.
    if (relation.kind !== 'none') return null;
    return (
      <button
        type="button"
        aria-label="Add friend"
        title="Add friend"
        disabled={busy}
        onClick={(e) => {
          stop(e);
          void run(send);
        }}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-court)]/30 bg-white text-[var(--color-court)] transition hover:bg-[var(--color-court)]/10 disabled:opacity-50"
      >
        <span aria-hidden>+</span>
      </button>
    );
  }

  const primaryShell =
    variant === 'primary'
      ? 'inline-flex w-full items-center justify-center px-5 py-2.5 text-sm'
      : 'inline-flex items-center justify-center px-3 py-1.5 text-xs';

  if (relation.kind === 'none') {
    return (
      <div className="w-full">
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            stop(e);
            void run(send);
          }}
          className={`${primaryShell} rounded-full bg-[var(--color-court)] font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:brightness-95 disabled:opacity-60`}
        >
          + Add friend
        </button>
        {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      </div>
    );
  }

  if (relation.kind === 'outgoing') {
    return (
      <div className="w-full">
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            stop(e);
            void run(cancel);
          }}
          className={`${primaryShell} rounded-full border border-[var(--color-ink)]/20 font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5 disabled:opacity-60`}
        >
          Request sent · Cancel
        </button>
        {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      </div>
    );
  }

  if (relation.kind === 'incoming') {
    return (
      <div className="w-full">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              stop(e);
              void run(accept);
            }}
            className={`${primaryShell} flex-1 rounded-full bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-60`}
          >
            Accept
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              stop(e);
              void run(decline);
            }}
            className={`${primaryShell} flex-1 rounded-full border border-[var(--color-ink)]/20 font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5 disabled:opacity-60`}
          >
            Decline
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      </div>
    );
  }

  // relation.kind === 'friends'
  return (
    <div ref={menuWrapperRef} className="relative w-full">
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          stop(e);
          setRemoveMenuOpen((open) => !open);
        }}
        aria-haspopup="menu"
        aria-expanded={removeMenuOpen}
        className={`${primaryShell} rounded-full border border-emerald-600/40 bg-emerald-50 font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60`}
      >
        ✓ Friends
        <span className="ml-1" aria-hidden>
          ▾
        </span>
      </button>
      {removeMenuOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--color-ink)]/10 bg-white shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={(e) => {
              stop(e);
              setRemoveMenuOpen(false);
              setRemoveOpen(true);
            }}
            className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Remove friend
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      <RemoveFriendModal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        username={username}
        onConfirm={remove}
      />
    </div>
  );
}
