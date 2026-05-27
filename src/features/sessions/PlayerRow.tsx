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

/** Skill-tier ramp driving the left accent rail + the Skill-column text. */
const SKILL_TIER_COLOR: Record<SkillLevel, string> = {
  beginner: '#15803d',
  intermediate: 'var(--color-court)',
  advanced: 'var(--color-hardwood)',
  pro: '#b45309',
};
const TIER_NONE = 'oklch(0.18 0.02 60 / 0.25)';

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
  const rowTint = isHost ? 'bg-amber-50' : isYou ? 'bg-[var(--color-court)]/5' : 'bg-white';

  return (
    <li
      className={`${ROW_GRID} relative overflow-hidden rounded-xl border border-[var(--color-ink)]/10 px-4 py-2.5 transition hover:-translate-y-px hover:border-[var(--color-court)]/45 hover:shadow-sm ${rowTint}`}
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
        } ${isHost ? 'text-[var(--color-court)]' : 'text-[var(--color-ink)]/35'}`}
      >
        {jersey ?? '—'}
      </span>

      {/* avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-court)]/20 bg-[var(--color-net)]">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold uppercase text-[var(--color-hardwood)]/60">
            {profile.username.charAt(0)}
          </span>
        )}
      </div>

      {/* Player — linked username + host/you chips */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to={`/u/${profile.username}`}
          className="truncate rounded text-sm font-semibold text-[var(--color-ink)] outline-none hover:text-[var(--color-court)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-court)]/40"
        >
          @{profile.username}
        </Link>
        {isHost ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-amber-700"
            aria-label="Host"
          >
            <span aria-hidden>👑</span> Host
          </span>
        ) : null}
        {isYou ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-700">
            You
          </span>
        ) : null}
      </div>

      {/* Pos */}
      <span className="text-center text-[13px] font-semibold tabular-nums text-[var(--color-hardwood)]">
        {profile.preferred_position ?? <span className="text-[var(--color-ink)]/30">—</span>}
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
        <span className="text-xs text-[var(--color-ink)]/30">—</span>
      )}

      {/* Yrs */}
      <span className="text-center text-[13px] font-semibold tabular-nums text-[var(--color-ink)]/65">
        {profile.years_playing ?? <span className="text-[var(--color-ink)]/30">—</span>}
      </span>
    </li>
  );
}
