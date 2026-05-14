import { Link } from 'react-router-dom';
import type { SessionRow } from './useSessionsByCourt';
import { formatSessionRange, formatTimeUntilEnd, getSessionStatus, relativeTime } from './formatTime';
import { useNow } from '../../lib/useNow';

type Role = 'going' | 'waitlist';

type Props = {
  session: SessionRow;
  courtName?: string | null;
  role?: Role;
};

const ROLE_PILL_CLASS: Record<Role, string> = {
  going: 'bg-green-100 text-green-700',
  waitlist: 'bg-amber-100 text-amber-700',
};

const ROLE_LABEL: Record<Role, string> = {
  going: 'Going',
  waitlist: 'Waitlist',
};

export default function SessionListItem({ session, courtName, role }: Props) {
  const now = useNow();
  const status = getSessionStatus(session, now);
  const cancelled = status === 'cancelled';
  const active = status === 'active';
  return (
    <Link
      to={`/sessions/${session.id}`}
      className={`block rounded-lg border bg-white px-4 py-3 transition hover:shadow-sm ${
        active
          ? 'border-emerald-400/60 hover:border-emerald-500'
          : 'border-[var(--color-ink)]/10 hover:border-[var(--color-court)]/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {courtName ? (
            <p className="truncate font-semibold text-[var(--color-ink)]">{courtName}</p>
          ) : null}
          <p
            className={
              courtName
                ? 'text-sm text-[var(--color-ink)]/70'
                : 'font-semibold text-[var(--color-ink)]'
            }
          >
            {formatSessionRange(session.starts_at, session.ends_at)}
          </p>
          {session.notes ? (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-ink)]/70">{session.notes}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {role ? (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-widest ${ROLE_PILL_CLASS[role]}`}
            >
              {ROLE_LABEL[role]}
            </span>
          ) : null}
          {cancelled ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-red-700">
              Cancelled
            </span>
          ) : active ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Currently Hooping · {formatTimeUntilEnd(session.ends_at, now)}
            </span>
          ) : (
            <span className="rounded-full bg-[var(--color-court)]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-court)]">
              {relativeTime(session.starts_at, now)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
