import type { PublicProfileRow } from '../profiles/useProfileByUsername';
import FriendActionButton from './FriendActionButton';
import ProfileIdentity from './ProfileIdentity';

type Props = {
  profile: PublicProfileRow;
  /** Called when the username link is clicked, so the overlay can close before
   *  the route changes (the overlay is state-driven, not route-driven). */
  onNavigate: () => void;
};

/**
 * One player-search result: shared identity block on the left, the morphing
 * FriendActionButton (compact) on the right. The button reads its own
 * relationship to the viewer, so it shows Add / Sent / Accept-Decline /
 * ✓ Friends without this row knowing anything about friendships.
 */
export default function PlayerSearchResult({ profile, onNavigate }: Props) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <ProfileIdentity profile={profile} onUsernameClick={onNavigate} />
      <div className="shrink-0">
        <FriendActionButton
          otherUserId={profile.id}
          username={profile.username}
          variant="compact"
        />
      </div>
    </li>
  );
}
