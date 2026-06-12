import type { KeyboardEvent } from 'react';
import type { UpcomingSession } from './useUpcomingSessions';
import { formatPanelTime, formatTimeUntilEnd } from '../sessions/formatTime';
import { useNow } from '../../lib/useNow';
import FriendActionButton from '../friends/FriendActionButton';

const SESSION_CAP = 15;

type Props = {
  entry: UpcomingSession;
  selected: boolean;
  live?: boolean;
  onSelect: () => void;
};

export default function SessionCard({ entry, selected, live = false, onSelect }: Props) {
  const { session, court, host, goingCount } = entry;
  const courtLabel = court?.name ?? court?.address ?? 'Basketball Court';
  const hostLabel = host ? `@${host.username}` : 'Unknown host';
  const initial = host?.username.charAt(0).toUpperCase() ?? '?';
  const now = useNow();

  // The outer "select this card" target is a div, not a button, so the
  // inner FriendActionButton doesn't become a nested-interactive element.
  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKey}
      aria-current={selected ? 'true' : undefined}
      className={`flex w-full cursor-pointer flex-col gap-2 rounded-xl border bg-[var(--surface)] px-4 py-3 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-volt)]/40 ${
        selected
          ? 'border-[var(--color-blue)] bg-[var(--color-blue)]/10 shadow-[0_0_0_1px_var(--color-blue)]'
          : live
            ? 'border-[var(--color-volt)]/45 shadow-[0_0_24px_-6px_rgba(200,255,45,0.4)] hover:border-[var(--color-volt)]'
            : 'border-[var(--border)] hover:border-[var(--color-blue)]/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-[var(--color-bone)]">{courtLabel}</p>
      </div>
      {live ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-volt)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#0c1402]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0c1402]" />
          Hooping · {formatTimeUntilEnd(session.ends_at, now)}
        </span>
      ) : (
        <span className="inline-flex w-fit items-center rounded-full bg-[var(--color-bone)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--color-bone)]">
          {formatPanelTime(session.starts_at)}
        </span>
      )}
      <div className="flex items-center gap-2 text-xs">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-blue)]/40 bg-[var(--color-night-3)]">
          {host?.avatar_url ? (
            <img src={host.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold uppercase text-[var(--color-blue)]">
              {initial}
            </span>
          )}
        </div>
        <span className="truncate font-semibold text-[var(--color-bone)]/70">{hostLabel}</span>
        {host ? (
          <FriendActionButton otherUserId={host.id} username={host.username} variant="icon" />
        ) : null}
        <span className="ml-auto whitespace-nowrap font-semibold text-[var(--color-bone)]/55">
          <span className="text-[var(--color-volt)]">{goingCount}</span>/{SESSION_CAP} going
        </span>
      </div>
    </div>
  );
}
