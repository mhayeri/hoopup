import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SessionListItem from '../sessions/SessionListItem';
import { useUserActiveSessions } from '../sessions/useUserActiveSessions';
import { getSessionStatus } from '../sessions/formatTime';
import { useNow } from '../../lib/useNow';

type Props = {
  userId: string;
};

export default function ActiveSessionsList({ userId }: Props) {
  const { entries, loading, error } = useUserActiveSessions(userId);
  const now = useNow();
  // The hook filters by `ends_at >= now` at fetch time; sessions can pass
  // their end while the user sits on the page. Drop ended rows live so they
  // disappear without needing a refetch.
  const visibleEntries = useMemo(
    () => entries.filter((e) => getSessionStatus(e.session, now) !== 'ended'),
    [entries, now]
  );

  if (loading) {
    return (
      <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-hardwood)]">Loading…</p>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        {error}
      </p>
    );
  }

  if (visibleEntries.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-[var(--color-ink)]/70">
          No upcoming sessions. Find a court on the map to host or join one.
        </p>
        <Link
          to="/"
          className="rounded-full border border-[var(--color-ink)]/20 px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
        >
          Open map
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {visibleEntries.map(({ session, court, role }) => (
        <li key={session.id}>
          <SessionListItem
            session={session}
            courtName={court?.name ?? court?.address ?? null}
            role={role}
          />
        </li>
      ))}
    </ul>
  );
}
