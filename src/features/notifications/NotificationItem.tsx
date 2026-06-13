import { Link } from 'react-router-dom';
import type { NotificationWithActor } from '../../lib/database.types';
import { formatPanelTime, relativeTime } from '../sessions/formatTime';
import { notificationHref, notificationMessage } from './notificationsApi';

type Props = {
  notification: NotificationWithActor;
  now: Date;
  /** Closes the panel when the row is followed. */
  onNavigate: () => void;
  onRemove: (id: string) => void;
};

/**
 * One row in the notifications dropdown: actor avatar, message, context
 * (court + time for a hosted game, relative timestamp otherwise), an unread
 * dot, and a dismiss button. The whole row is a link to the session or the
 * Friends tab; the × dismisses without navigating.
 */
export default function NotificationItem({ notification, now, onNavigate, onRemove }: Props) {
  const { actor, session, type, read_at, created_at } = notification;
  const unread = read_at === null;
  const cancelled = !!session?.cancelled_at;

  return (
    <div
      className={`group relative flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 transition last:border-b-0 ${
        unread
          ? 'bg-[var(--color-blue)]/[0.06] hover:bg-[var(--color-blue)]/10'
          : 'hover:bg-[var(--hover)]'
      }`}
    >
      <Link
        to={notificationHref(notification)}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <Avatar
          username={actor?.username ?? '?'}
          avatarUrl={actor?.avatar_url ?? null}
          type={type}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-[var(--color-bone)]">
            {notificationMessage(notification)}
          </p>
          {type === 'friend_session' && session ? (
            <p
              className={`mt-1 text-xs ${
                cancelled
                  ? 'text-[var(--color-bone)]/40 line-through'
                  : 'text-[var(--color-bone)]/65'
              }`}
            >
              {session.court?.name ?? 'A court'} ·{' '}
              {cancelled ? 'Cancelled' : formatPanelTime(session.starts_at, now)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--color-bone)]/50">
              {relativeTime(created_at, now)}
            </p>
          )}
        </div>
      </Link>
      {unread ? (
        <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-volt)]" />
      ) : null}
      <button
        type="button"
        onClick={() => onRemove(notification.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-full p-1 text-[var(--color-bone)]/40 opacity-0 transition hover:bg-[var(--hover)] hover:text-[var(--color-bone)] focus:opacity-100 group-hover:opacity-100"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function Avatar({
  username,
  avatarUrl,
  type,
}: {
  username: string;
  avatarUrl: string | null;
  type: NotificationWithActor['type'];
}) {
  // Ring color carries the type: volt = a friend is hooping, blue = friend request.
  const ring =
    type === 'friend_session' ? 'border-[var(--color-volt)]/40' : 'border-[var(--color-blue)]/50';
  const initial =
    type === 'friend_session' ? 'text-[var(--color-volt)]' : 'text-[var(--color-blue)]';
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-[var(--color-night-3)] ${ring}`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={`text-xs font-bold uppercase ${initial}`}>{username.charAt(0)}</span>
      )}
    </div>
  );
}
