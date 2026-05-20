import type { RsvpWithProfile } from '../../lib/database.types';
import { formatAbsoluteDateTime } from './formatTime';
import FriendActionButton from '../friends/FriendActionButton';

type Profile = NonNullable<RsvpWithProfile['profile']>;

type Props = {
  profile: Profile;
  createdAt: string;
};

const SKILL_LABEL: Record<NonNullable<Profile['skill_level']>, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};

export default function PlayerHoverCard({ profile, createdAt }: Props) {
  return (
    <div
      role="dialog"
      aria-label={`Profile for @${profile.username}`}
      className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-[var(--color-ink)]/10 bg-white p-4 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-court)]/20 bg-[var(--color-net)]">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold uppercase text-[var(--color-hardwood)]/60">
              {profile.username.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-black text-[var(--color-court)]">
            @{profile.username}
          </h3>
          {profile.skill_level || profile.preferred_position ? (
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
            </div>
          ) : null}
          {profile.years_playing != null ? (
            <p className="mt-1 text-xs text-[var(--color-ink)]/60">
              {profile.years_playing} {profile.years_playing === 1 ? 'yr' : 'yrs'} playing
            </p>
          ) : null}
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-3 whitespace-pre-wrap text-sm italic text-[var(--color-ink)]/80">
          “{profile.bio}”
        </p>
      ) : null}

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
        RSVP'd {formatAbsoluteDateTime(createdAt)}
      </p>

      <div className="mt-3 border-t border-[var(--color-ink)]/10 pt-3">
        <FriendActionButton
          otherUserId={profile.id}
          username={profile.username}
          variant="compact"
        />
      </div>
    </div>
  );
}
