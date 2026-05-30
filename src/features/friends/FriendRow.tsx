import { useState } from 'react';
import type { FriendshipWithProfiles } from '../../lib/database.types';
import { otherProfile } from './friendsApi';
import ProfileIdentity from './ProfileIdentity';
import RemoveFriendModal from './RemoveFriendModal';

export type FriendRowVariant = 'incoming' | 'outgoing' | 'accepted' | 'public-accepted';

type Props = {
  friendship: FriendshipWithProfiles;
  viewerId: string;
  variant: FriendRowVariant;
  onAccept?: (otherUserId: string) => Promise<{ error: string | null }>;
  onDecline?: (otherUserId: string) => Promise<{ error: string | null }>;
  onCancel?: (otherUserId: string) => Promise<{ error: string | null }>;
  onRemove?: (otherUserId: string) => Promise<{ error: string | null }>;
};

/**
 * One row in the Friends tab: avatar + username link + identity pills, with
 * variant-specific action buttons on the right.
 *
 * `public-accepted` is the variant rendered on someone else's profile —
 * read-only, no buttons.
 */
export default function FriendRow({
  friendship,
  viewerId,
  variant,
  onAccept,
  onDecline,
  onCancel,
  onRemove,
}: Props) {
  const profile = otherProfile(friendship, viewerId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  if (!profile) return null;

  const stackOnMobile = variant === 'incoming' || variant === 'outgoing';

  async function run(fn?: (id: string) => Promise<{ error: string | null }>) {
    if (!fn || !profile) return;
    setBusy(true);
    setError(null);
    const { error: err } = await fn(profile.id);
    if (err) setError(err);
    setBusy(false);
  }

  return (
    <li
      className={`flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 ${
        stackOnMobile ? 'flex-col sm:flex-row sm:items-center' : 'items-center'
      }`}
    >
      <ProfileIdentity
        profile={profile}
        footer={error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
      />

      <div
        className={`flex gap-2 ${
          stackOnMobile ? 'w-full sm:w-auto sm:shrink-0' : 'shrink-0'
        }${variant === 'outgoing' ? ' justify-end' : ''}`}
      >
        {variant === 'incoming' ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(onAccept)}
              className="flex-1 sm:flex-none rounded-full bg-[var(--color-volt)] px-3 py-2 sm:py-1.5 text-xs font-semibold text-[#0c1402] transition hover:bg-[var(--color-volt)]/90 disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(onDecline)}
              className="flex-1 sm:flex-none rounded-full border border-white/15 px-3 py-2 sm:py-1.5 text-xs font-semibold text-[var(--color-bone)]/70 transition hover:bg-white/8 disabled:opacity-60"
            >
              Decline
            </button>
          </>
        ) : null}
        {variant === 'outgoing' ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(onCancel)}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-[var(--color-bone)]/70 transition hover:bg-white/8 disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
        {variant === 'accepted' ? (
          <button
            type="button"
            aria-label={`Remove @${profile.username}`}
            title="Remove friend"
            disabled={busy}
            onClick={() => setRemoveOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 text-[var(--color-bone)]/55 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
          >
            <span aria-hidden>✕</span>
          </button>
        ) : null}
      </div>
      {variant === 'accepted' && onRemove ? (
        <RemoveFriendModal
          open={removeOpen}
          onClose={() => setRemoveOpen(false)}
          username={profile.username}
          onConfirm={() => onRemove(profile.id)}
        />
      ) : null}
    </li>
  );
}
