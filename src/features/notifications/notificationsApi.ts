import type { NotificationWithActor } from '../../lib/database.types';

/**
 * PostgREST embed for the notifications feed. `notifications` has two FKs to
 * `profiles` (user_id, actor_id) so the actor embed is disambiguated by the
 * constraint name. `user_id` is always the signed-in recipient, so it isn't
 * embedded. The session → court embed is null for 'friend_request' rows; it
 * resolves under the recipient's RLS because sessions/courts are world-SELECT.
 */
export const NOTIFICATIONS_SELECT = `id, user_id, actor_id, type, session_id, read_at, created_at,
  actor:profiles!notifications_actor_id_fkey (id, username, avatar_url),
  session:sessions!notifications_session_id_fkey (
    id, starts_at, ends_at, cancelled_at,
    court:courts!sessions_court_id_fkey ( id, name )
  )`;

/** Where clicking a notification takes you. */
export function notificationHref(n: NotificationWithActor): string {
  if (n.type === 'friend_session' && n.session_id) {
    return `/sessions/${n.session_id}`;
  }
  // friend_request → the recipient's own Friends tab to accept/decline.
  return '/profile?tab=friends';
}

/** One-line message for a notification row. */
export function notificationMessage(n: NotificationWithActor): string {
  const who = n.actor ? `@${n.actor.username}` : 'Someone';
  return n.type === 'friend_session'
    ? `${who} is hosting a game`
    : `${who} sent you a friend request`;
}
