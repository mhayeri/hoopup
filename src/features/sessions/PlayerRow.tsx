import { Link } from 'react-router-dom';
import type { RsvpWithProfile } from '../../lib/database.types';

type SkillLevel = NonNullable<NonNullable<RsvpWithProfile['profile']>['skill_level']>;

/**
 * Shared box-score grid — jersey · avatar · player · pos · skill · yrs.
 * Exported so RosterSection's column header lines up with the rows. (The class
 * literal must live in a file Tailwind scans; reuse it via this import.)
 */
export const ROW_GRID =
  'grid grid-cols-[34px_36px_minmax(0,1fr)_50px_112px_44px] items-center gap-x-2.5';

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};

/** Skill-tier ramp driving the left accent rail + the Skill-column text.
 *  Shared with the friends/identity skill pill via the `--color-skill-*` tokens. */
const SKILL_TIER_COLOR: Record<SkillLevel, string> = {
  beginner: 'var(--color-skill-beginner)',
  intermediate: 'var(--color-skill-intermediate)',
  advanced: 'var(--color-skill-advanced)',
  pro: 'var(--color-skill-pro)',
};
const TIER_NONE = 'rgba(255,255,255,0.3)';

type Props = {
  rsvp: RsvpWithProfile;
  isHost?: boolean;
  isYou?: boolean;
  /** 1-based lineup number; `null` for the overflow waitlist (rendered as a dash). */
  jersey?: number | null;
};

export default function PlayerRow({ rsvp, isHost = false, isYou = false, jersey = null }: Props) {
  if (!rsvp.profile) return null;
  const { profile } = rsvp;
  const tier = profile.skill_level ? SKILL_TIER_COLOR[profile.skill_level] : TIER_NONE;
  const rowTint = isYou ? 'bg-[var(--color-blue)]/10' : 'bg-white/[0.03]';

  return (
    <li
      className={`${ROW_GRID} relative overflow-hidden rounded-xl border border-white/10 px-4 py-2.5 transition hover:-translate-y-px hover:border-white/20 hover:shadow-sm ${rowTint}`}
    >
      {/* skill-tier rail — absolute so it never shifts the column grid */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[5px]"
        style={{ backgroundColor: tier }}
      />

      {/* # — jersey number */}
      <span
        className={`text-center font-display leading-none tabular-nums ${
          jersey == null ? 'text-lg' : 'text-2xl'
        } ${isHost ? 'text-[var(--color-volt)]' : 'text-white/35'}`}
      >
        {jersey ?? '-'}
      </span>

      {/* avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-night-3)]">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold uppercase text-[var(--color-bone)]/60">
            {profile.username.charAt(0)}
          </span>
        )}
      </div>

      {/* Player — linked username + host/you chips */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to={`/u/${profile.username}`}
          className="truncate rounded text-sm font-semibold text-[var(--color-bone)] outline-none hover:text-[var(--color-volt)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-volt)]/40"
        >
          @{profile.username}
        </Link>
        {isHost ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-volt)]/40 bg-[var(--color-volt)]/10 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[var(--color-volt)]"
            aria-label="Host"
          >
            <span aria-hidden>&#x1F451;</span> Host
          </span>
        ) : null}
        {isYou ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--color-blue)]/20 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[var(--color-blue)]">
            You
          </span>
        ) : null}
      </div>

      {/* Pos */}
      <span className="text-center text-[13px] font-semibold tabular-nums text-[var(--color-bone)]/60">
        {profile.preferred_position ?? <span className="text-white/30">-</span>}
      </span>

      {/* Skill */}
      {profile.skill_level ? (
        <span
          className="truncate text-xs font-bold uppercase tracking-wide"
          style={{ color: tier }}
        >
          {SKILL_LABEL[profile.skill_level]}
        </span>
      ) : (
        <span className="text-xs text-white/30">-</span>
      )}

      {/* Yrs */}
      <span className="text-center text-[13px] font-semibold tabular-nums text-[var(--color-bone)]/65">
        {profile.years_playing ?? <span className="text-white/30">-</span>}
      </span>
    </li>
  );
}
