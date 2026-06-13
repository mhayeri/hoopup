import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Position, SkillLevel } from '../../lib/database.types';
import { SKILL_LABEL, SKILL_PILL } from '../../lib/skill';

/** Just the fields the identity block renders — satisfied by both
 *  `PublicProfile` (friendship embeds) and `PublicProfileRow` (search). */
type IdentityProfile = {
  username: string;
  avatar_url: string | null;
  skill_level: SkillLevel | null;
  preferred_position: Position | null;
  years_playing: number | null;
};

type Props = {
  profile: IdentityProfile;
  /** Fires when the username link is clicked — e.g. to close a search overlay
   *  before navigating to the profile. */
  onUsernameClick?: () => void;
  /** Optional content under the pills (FriendRow uses it for an inline error). */
  footer?: ReactNode;
};

/**
 * The avatar + `@username` link + identity pills (skill / position / years)
 * shared by the Friends-tab rows and the player-search results.
 */
export default function ProfileIdentity({ profile, onUsernameClick, footer }: Props) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <ProfileAvatar avatarUrl={profile.avatar_url} username={profile.username} />
      <div className="min-w-0 flex-1">
        <Link
          to={`/u/${profile.username}`}
          onClick={onUsernameClick}
          className="block truncate text-sm font-semibold text-[var(--color-bone)] hover:text-[var(--color-volt)] hover:underline"
        >
          @{profile.username}
        </Link>
        <div className="mt-1 flex flex-wrap gap-1">
          {profile.skill_level ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${SKILL_PILL[profile.skill_level]}`}
            >
              {SKILL_LABEL[profile.skill_level]}
            </span>
          ) : null}
          {profile.preferred_position ? (
            <span className="rounded-full bg-[var(--color-bone)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-bone)]">
              {profile.preferred_position}
            </span>
          ) : null}
          {profile.years_playing != null ? (
            <span className="rounded-full bg-[var(--color-bone)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-bone)]/70">
              {profile.years_playing} {profile.years_playing === 1 ? 'yr' : 'yrs'}
            </span>
          ) : null}
        </div>
        {footer}
      </div>
    </div>
  );
}

function ProfileAvatar({ avatarUrl, username }: { avatarUrl: string | null; username: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-volt)]/40 bg-[var(--color-night-3)]">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-bold uppercase text-[var(--color-volt)]">
          {username.charAt(0)}
        </span>
      )}
    </div>
  );
}
