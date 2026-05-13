import { useEffect, useRef } from 'react';
import type { RsvpWithProfile } from '../../lib/database.types';
import { relativePastTime } from './formatTime';
import PlayerHoverCard from './PlayerHoverCard';

const HOVER_OPEN_DELAY_MS = 150;
const HOVER_CLOSE_DELAY_MS = 100;

type Props = {
  rsvp: RsvpWithProfile;
  open: boolean;
  onOpenChange: (next: boolean) => void;
};

const SKILL_LABEL: Record<NonNullable<RsvpWithProfile['profile']>['skill_level'] & string, string> =
  {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    pro: 'Pro',
  };

export default function PlayerRow({ rsvp, open, onOpenChange }: Props) {
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (openTimerRef.current != null) window.clearTimeout(openTimerRef.current);
      if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  if (!rsvp.profile) return null;
  const { profile } = rsvp;

  function clearTimers() {
    if (openTimerRef.current != null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleOpen() {
    clearTimers();
    openTimerRef.current = window.setTimeout(() => onOpenChange(true), HOVER_OPEN_DELAY_MS);
  }

  function scheduleClose() {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => onOpenChange(false), HOVER_CLOSE_DELAY_MS);
  }

  return (
    <li
      className="relative rounded-lg border border-[var(--color-ink)]/10 bg-white px-4 py-3 transition hover:border-[var(--color-court)]/50 hover:shadow-sm focus-within:border-[var(--color-court)]/50 focus-within:shadow-sm"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          clearTimers();
          onOpenChange(!open);
        }}
        onFocus={() => {
          clearTimers();
          onOpenChange(true);
        }}
        onBlur={() => onOpenChange(false)}
        className="flex w-full items-start justify-between gap-3 text-left outline-none"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-court)]/20 bg-[var(--color-net)]">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold uppercase text-[var(--color-hardwood)]/60">
                {profile.username.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
              @{profile.username}
            </p>
            {profile.skill_level || profile.preferred_position || profile.years_playing != null ? (
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
                    {profile.years_playing} yrs
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 text-xs text-[var(--color-ink)]/60">
          {relativePastTime(rsvp.created_at)}
        </span>
      </button>

      {open ? <PlayerHoverCard profile={profile} createdAt={rsvp.created_at} /> : null}
    </li>
  );
}
