import type { FriendshipWithProfiles, PublicProfile } from '../../lib/database.types';

/** Public-profile fields to embed when joining friendships → profiles. */
const PROFILE_FIELDS =
  'id, username, avatar_url, bio, skill_level, preferred_position, years_playing';

/**
 * PostgREST select string that joins both parties' profiles onto a friendship.
 * Names match the auto-generated FK constraints `friendships_<col>_fkey`.
 */
export const FRIENDSHIP_SELECT = `requester_id, addressee_id, status, created_at, accepted_at,
  requester:profiles!friendships_requester_id_fkey (${PROFILE_FIELDS}),
  addressee:profiles!friendships_addressee_id_fkey (${PROFILE_FIELDS})`;

/** Possible relationship between the viewer and another user, from the viewer's perspective. */
export type FriendshipRelation =
  | { kind: 'none' }
  | { kind: 'self' }
  | { kind: 'outgoing'; createdAt: string }
  | { kind: 'incoming'; createdAt: string }
  | { kind: 'friends'; acceptedAt: string };

/** Reduce a friendship row + the viewer's id into a single relation kind. */
export function relationFromRow(
  row: Pick<
    FriendshipWithProfiles,
    'requester_id' | 'addressee_id' | 'status' | 'created_at' | 'accepted_at'
  >,
  viewerId: string
): FriendshipRelation {
  if (row.status === 'accepted') {
    return { kind: 'friends', acceptedAt: row.accepted_at ?? row.created_at };
  }
  if (row.requester_id === viewerId) {
    return { kind: 'outgoing', createdAt: row.created_at };
  }
  if (row.addressee_id === viewerId) {
    return { kind: 'incoming', createdAt: row.created_at };
  }
  return { kind: 'none' };
}

/** Returns the "other party" profile from a friendship row, relative to the viewer. */
export function otherProfile(row: FriendshipWithProfiles, viewerId: string): PublicProfile | null {
  return row.requester_id === viewerId ? row.addressee : row.requester;
}
