import { Link } from 'react-router-dom';
import type { SessionRow } from './useSessionsByCourt';
import {
  formatSessionRange,
  formatTimeUntilEnd,
  getSessionStatus,
  relativeTime,
} from './formatTime';
import { useNow } from '../../lib/useNow';

type Role = 'going' | 'waitlist';

type Props = {
  session: SessionRow;
  courtName?: string | null;
  role?: Role;
};

const ROLE_PILL_CLASS: Record<Role, string> = {
  going: 'bg-[var(--color-volt)] text-[#0c1402]',
  waitlist: 'bg-white/10 text-[var(--color-bone)]/80',
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
      className={`block rounded-lg border bg-white/[0.03] px-4 py-3 transition hover:shadow-sm ${
        active
          ? 'border-[var(--color-volt)]/45 hover:border-[var(--color-volt)]'
          : 'border-white/10 hover:border-[var(--color-blue)]/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {courtName ? (
            <p className="truncate font-semibold text-[var(--color-bone)]">{courtName}</p>
          ) : null}
          <p
            className={
              courtName
                ? 'text-sm text-[var(--color-bone)]/70'
                : 'font-semibold text-[var(--color-bone)]'
            }
          >
            {formatSessionRange(session.starts_at, session.ends_at)}
          </p>
          {session.notes ? (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-bone)]/70">{session.notes}</p>
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
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-red-300">
              Cancelled
            </span>
          ) : active ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-volt)] px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-[#0c1402]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0c1402]" />
              Hooping - {formatTimeUntilEnd(session.ends_at, now)}
            </span>
          ) : (
            <span className="rounded-full bg-[var(--color-blue)]/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-blue)]">
              {relativeTime(session.starts_at, now)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
