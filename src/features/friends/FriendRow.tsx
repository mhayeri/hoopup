import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FriendshipWithProfiles, PublicProfile, SkillLevel } from '../../lib/database.types';
import { otherProfile } from './friendsApi';
import RemoveFriendModal from './RemoveFriendModal';

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};

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

  async function run(fn?: (id: string) => Promise<{ error: string | null }>) {
    if (!fn || !profile) return;
    setBusy(true);
    setError(null);
    const { error: err } = await fn(profile.id);
    if (err) setError(err);
    setBusy(false);
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--color-ink)]/10 bg-white px-4 py-3">
      <ProfileAvatar profile={profile} />
      <div className="min-w-0 flex-1">
        <Link
          to={`/u/${profile.username}`}
          className="block truncate text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-court)]"
        >
          @{profile.username}
        </Link>
        <div className="mt-1 flex flex-wrap gap-1">
          {profile.skill_level ? (
            <span className="rounded-full bg-[var(--color-court)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-court)]">
              {SKILL_LABEL[profile.skill_level]}
            </span>
          ) : null}
          {profile.preferred_position ? (
            <span className="rounded-full bg-[var(--color-hardwood)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
              {profile.preferred_position}
            </span>
          ) : null}
          {profile.years_playing != null ? (
            <span className="rounded-full bg-[var(--color-ink)]/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink)]/70">
              {profile.years_playing} {profile.years_playing === 1 ? 'yr' : 'yrs'}
            </span>
          ) : null}
        </div>
        {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
      </div>

      <div className="flex shrink-0 gap-2">
        {variant === 'incoming' ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(onAccept)}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(onDecline)}
              className="rounded-full border border-[var(--color-ink)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5 disabled:opacity-60"
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
            className="rounded-full border border-[var(--color-ink)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5 disabled:opacity-60"
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-ink)]/15 text-[var(--color-ink)]/60 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
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

function ProfileAvatar({ profile }: { profile: PublicProfile }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-court)]/20 bg-[var(--color-net)]">
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-bold uppercase text-[var(--color-hardwood)]/60">
          {profile.username.charAt(0)}
        </span>
      )}
    </div>
  );
}
