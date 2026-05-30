import { useFriendships } from './useFriendships';
import FriendRow from './FriendRow';

type Props = {
  /** The profile owner — whose friendships are being shown. */
  userId: string;
  /** The viewer (current authenticated user). Drives self-vs-other layout. */
  viewerId: string | null;
};

/**
 * Friends tab content.
 *
 * Self view (viewerId === userId): three stacked sections — pending callout,
 * accepted list, collapsed sent-requests <details>.
 *
 * Other-user view: just the accepted list (RLS already filters out pending
 * rows we'd never be allowed to see).
 */
export default function FriendsTab({ userId, viewerId }: Props) {
  const { accepted, incoming, outgoing, loading, error, accept, decline, cancel, remove } =
    useFriendships(userId);

  const isSelf = viewerId === userId;

  if (loading) {
    return (
      <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-bone)]/60">Loading…</p>
    );
  }

  if (error) {
    return (
      <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {isSelf && incoming.length > 0 ? (
        <section>
          <SectionHead label="Pending requests" count={incoming.length} suffix="incoming" />
          <div className="mt-3 rounded-2xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/5 p-3">
            <ul className="space-y-2">
              {incoming.map((f) => (
                <FriendRow
                  key={`${f.requester_id}:${f.addressee_id}`}
                  friendship={f}
                  viewerId={userId}
                  variant="incoming"
                  onAccept={accept}
                  onDecline={decline}
                />
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section>
        <SectionHead label="Friends" count={accepted.length} />
        {accepted.length === 0 ? (
          <EmptyState isSelf={isSelf} />
        ) : (
          <ul className="mt-3 space-y-2">
            {accepted.map((f) => (
              <FriendRow
                key={`${f.requester_id}:${f.addressee_id}`}
                friendship={f}
                viewerId={userId}
                variant={isSelf ? 'accepted' : 'public-accepted'}
                onRemove={isSelf ? remove : undefined}
              />
            ))}
          </ul>
        )}
      </section>

      {isSelf && outgoing.length > 0 ? (
        <section>
          <details className="rounded-2xl border border-white/10 p-3">
            <summary className="flex cursor-pointer items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-bone)]/60">
              <span>Sent requests</span>
              <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-[var(--color-bone)]/70">
                {outgoing.length} outgoing
              </span>
            </summary>
            <ul className="mt-3 space-y-2">
              {outgoing.map((f) => (
                <FriendRow
                  key={`${f.requester_id}:${f.addressee_id}`}
                  friendship={f}
                  viewerId={userId}
                  variant="outgoing"
                  onCancel={cancel}
                />
              ))}
            </ul>
          </details>
        </section>
      ) : null}
    </div>
  );
}

function SectionHead({ label, count, suffix }: { label: string; count: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-bone)]/60">
        {label}
      </span>
      <span className="rounded-full bg-[var(--color-blue)]/15 px-2 py-0.5 text-xs font-bold text-[var(--color-blue)]">
        {count}
        {suffix ? ` ${suffix}` : ''}
      </span>
    </div>
  );
}

function EmptyState({ isSelf }: { isSelf: boolean }) {
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-white/15 p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/60">
        {isSelf ? 'No friends yet' : 'No friends to show'}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-bone)]/55">
        {isSelf
          ? "Find players at sessions and add them - they'll show up here once accepted."
          : "This player hasn't added any friends yet."}
      </p>
    </div>
  );
}
