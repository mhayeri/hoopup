import { Link } from 'react-router-dom';
import type { SessionRow } from './useSessionsByCourt';
import { formatSessionRange, relativeTime } from './formatTime';

type Props = { session: SessionRow };

export default function SessionListItem({ session }: Props) {
  const cancelled = session.cancelled_at != null;
  return (
    <Link
      to={`/sessions/${session.id}`}
      className="block rounded-lg border border-[var(--color-ink)]/10 bg-white px-4 py-3 transition hover:border-[var(--color-court)]/50 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-ink)]">
            {formatSessionRange(session.starts_at, session.ends_at)}
          </p>
          {session.notes ? (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-ink)]/70">{session.notes}</p>
          ) : null}
        </div>
        {cancelled ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-red-700">
            Cancelled
          </span>
        ) : (
          <span className="rounded-full bg-[var(--color-court)]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-court)]">
            {relativeTime(session.starts_at)}
          </span>
        )}
      </div>
    </Link>
  );
}
