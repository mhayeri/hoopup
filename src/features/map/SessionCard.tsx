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
      className={`flex w-full cursor-pointer flex-col gap-2 rounded-xl border bg-white px-4 py-3 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-court)]/40 ${
        selected
          ? 'border-[var(--color-court)] bg-[var(--color-court)]/6 shadow-sm'
          : live
            ? 'border-emerald-400/60 hover:border-emerald-500'
            : 'border-[var(--color-ink)]/10 hover:border-[var(--color-court)]/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-[var(--color-ink)]">{courtLabel}</p>
      </div>
      {live ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          Hooping · {formatTimeUntilEnd(session.ends_at, now)}
        </span>
      ) : (
        <span className="inline-flex w-fit items-center rounded-full bg-[var(--color-ink)] px-2 py-0.5 text-[11px] font-bold text-white">
          {formatPanelTime(session.starts_at)}
        </span>
      )}
      <div className="flex items-center gap-2 text-xs">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-court)]/20 bg-[var(--color-net)]">
          {host?.avatar_url ? (
            <img src={host.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold uppercase text-[var(--color-hardwood)]/60">
              {initial}
            </span>
          )}
        </div>
        <span className="truncate font-semibold text-[var(--color-ink)]/80">{hostLabel}</span>
        {host ? (
          <FriendActionButton otherUserId={host.id} username={host.username} variant="icon" />
        ) : null}
        <span className="ml-auto whitespace-nowrap font-semibold text-[var(--color-ink)]/60">
          <span className="text-[var(--color-court)]">{goingCount}</span>/{SESSION_CAP} going
        </span>
      </div>
    </div>
  );
}
