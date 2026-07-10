import { useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { useTheme } from '../providers/useTheme';
import { useProfile } from '../features/profiles/useProfile';
import { useProfileByUsername } from '../features/profiles/useProfileByUsername';
import ProfileEditForm from '../features/profiles/ProfileEditForm';
import AvatarUpload from '../features/profiles/AvatarUpload';
import ChangePasswordModal from '../features/profiles/ChangePasswordModal';
import DeleteAccountModal from '../features/profiles/DeleteAccountModal';
import ActiveSessionsList from '../features/profiles/ActiveSessionsList';
import Tabs, { type TabItem } from '../components/Tabs';
import FriendsTab from '../features/friends/FriendsTab';
import FavoriteCourtsList from '../features/courts/FavoriteCourtsList';
import FriendActionButton from '../features/friends/FriendActionButton';
import type { PublicProfileRow } from '../features/profiles/useProfileByUsername';

type TabId = 'sessions' | 'friends' | 'favorites' | 'settings';

const ALL_TABS: TabId[] = ['sessions', 'friends', 'favorites', 'settings'];
// Favorites + Settings only exist on your own profile, never on a public /u/:username.
const SELF_ONLY_TABS: TabId[] = ['favorites', 'settings'];

export default function ProfilePage() {
  const { user } = useAuth();
  const { username: slug } = useParams<{ username?: string }>();
  const isPublicRoute = !!slug;

  // Branch the data source: by username on /u/:username, by user id on /profile.
  // We call both hooks unconditionally and feed the inactive one a null arg,
  // which the hook treats as "do nothing" (loading=false, profile=null).
  const ownHook = useProfile(isPublicRoute ? null : (user?.id ?? null));
  const publicHook = useProfileByUsername(isPublicRoute ? (slug ?? null) : null);

  const profile = isPublicRoute ? publicHook.profile : ownHook.profile;
  const loading = isPublicRoute ? publicHook.loading : ownHook.loading;
  const error = isPublicRoute ? publicHook.error : ownHook.error;
  const refresh = isPublicRoute ? publicHook.refresh : ownHook.refresh;
  const updateProfile = isPublicRoute ? null : ownHook.updateProfile;

  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Deep-link the active tab via ?tab= (e.g. home QuickActions → /profile?tab=favorites).
  // isPublicRoute is known synchronously, so we can drop self-only tabs on public pages.
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as TabId | null;
  const initialTab: TabId =
    requestedTab &&
    ALL_TABS.includes(requestedTab) &&
    (!isPublicRoute || !SELF_ONLY_TABS.includes(requestedTab))
      ? requestedTab
      : 'sessions';
  const [tab, setTab] = useState<TabId>(initialTab);

  const hasEmailAuth =
    (user?.app_metadata?.providers as string[] | undefined)?.includes('email') ?? false;

  // Self lives at /profile. If the public route resolved to the signed-in
  // user (e.g. clicked through a friend-of-friend chain back to yourself),
  // redirect — see the guard below. So everything past that point treats
  // isPublicRoute as "someone else's page".
  const isSelf = !isPublicRoute && !!profile;
  const showAddFriendButton = isPublicRoute && !!profile;

  const tabItems: TabItem[] = isSelf
    ? [
        { id: 'sessions', label: 'Sessions' },
        { id: 'friends', label: 'Friends' },
        { id: 'favorites', label: 'Favorites' },
        { id: 'settings', label: 'Settings' },
      ]
    : [
        { id: 'sessions', label: 'Sessions' },
        { id: 'friends', label: 'Friends' },
      ];

  if (loading) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
        <p className="font-mono text-sm tracking-[0.4em] text-[var(--color-bone)]/55 uppercase">
          Loading…
        </p>
      </main>
    );
  }

  if (isPublicRoute && user && publicHook.profile?.id === user.id) {
    return <Navigate to="/profile" replace />;
  }

  if (error || !profile) {
    return (
      <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
        <div className="mx-auto max-w-2xl">
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error ?? 'Profile not found.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-[var(--color-night)] text-[var(--color-bone)]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <aside className="lg:col-span-5">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--color-night-2)] p-8 shadow-sm">
              {isSelf && editing && updateProfile && ownHook.profile ? (
                // Edit mode (self): the full avatar uploader on top, the form below.
                <>
                  <AvatarUpload
                    userId={profile.id}
                    currentUrl={profile.avatar_url}
                    onUploaded={async (url) => {
                      await updateProfile({ avatar_url: url });
                    }}
                  />
                  <div className="mt-6 border-t border-[var(--border)] pt-6">
                    <ProfileEditForm
                      profile={ownHook.profile}
                      onSubmit={async (patch) => {
                        const result = await updateProfile(patch);
                        if (!result.error) {
                          setEditing(false);
                          void refresh();
                        }
                        return result;
                      }}
                      onCancel={() => setEditing(false)}
                    />
                  </div>
                </>
              ) : (
                // Read mode (self or public): identity sits beside the avatar so the
                // top of the card isn't blank; the action slot + stats follow below.
                <>
                  <div className="flex items-start gap-4">
                    <ReadOnlyAvatar url={profile.avatar_url} username={profile.username} />
                    <div className="min-w-0 flex-1">
                      <Identity
                        profile={profile}
                        email={isSelf ? (user?.email ?? null) : null}
                        onEdit={isSelf ? () => setEditing(true) : null}
                      />
                    </div>
                  </div>

                  {isSelf && updateProfile ? (
                    <div className="mt-6">
                      <AvatarUpload
                        userId={profile.id}
                        currentUrl={profile.avatar_url}
                        onUploaded={async (url) => {
                          await updateProfile({ avatar_url: url });
                        }}
                        showAvatar={false}
                      />
                    </div>
                  ) : showAddFriendButton ? (
                    <div className="mt-6">
                      <FriendActionButton
                        otherUserId={profile.id}
                        username={profile.username}
                        variant="primary"
                      />
                    </div>
                  ) : null}

                  <div className="mt-6 border-t border-[var(--border)] pt-6">
                    <ProfileStats profile={profile} />
                  </div>
                </>
              )}
            </div>
          </aside>

          <section className="mt-6 space-y-6 lg:col-span-7 lg:mt-0">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--color-night-2)] p-8 shadow-sm">
              <Tabs
                items={tabItems}
                value={tab}
                onChange={(id) => setTab(id as TabId)}
                ariaLabel="Profile sections"
              />
              <div
                role="tabpanel"
                id={`tabpanel-${tab}`}
                aria-labelledby={`tab-${tab}`}
                className="mt-6"
              >
                {tab === 'sessions' ? <ActiveSessionsList userId={profile.id} /> : null}
                {tab === 'friends' ? (
                  <FriendsTab userId={profile.id} viewerId={isSelf ? (user?.id ?? null) : null} />
                ) : null}
                {tab === 'favorites' && isSelf ? <FavoriteCourtsList userId={profile.id} /> : null}
                {tab === 'settings' && isSelf ? (
                  <SettingsPanel
                    notificationsEnabled={ownHook.profile?.notifications_enabled ?? true}
                    onToggleNotifications={(value) => {
                      void ownHook.updateProfile({ notifications_enabled: value });
                    }}
                    onChangePassword={hasEmailAuth ? () => setPasswordOpen(true) : null}
                    onDeleteAccount={() => setDeleteOpen(true)}
                  />
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>

      {isSelf && hasEmailAuth ? (
        <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      ) : null}
      {isSelf ? (
        <DeleteAccountModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          username={profile.username}
        />
      ) : null}
    </main>
  );
}

function ReadOnlyAvatar({ url, username }: { url: string | null; username: string }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-blue)]/40 bg-[var(--color-night-3)]">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-bold uppercase text-[var(--color-blue)]">
          {username.charAt(0)}
        </span>
      )}
    </div>
  );
}

// Username + (self-only Edit + email) + bio. Rendered beside the avatar.
function Identity({
  profile,
  email,
  onEdit,
}: {
  // Accepts both the full owner row and the narrower public-route row —
  // ProfileRow is structurally assignable to PublicProfileRow.
  profile: PublicProfileRow;
  email: string | null;
  onEdit: (() => void) | null;
}) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        {/* --volt-text keeps the name legible in both themes: volt on night,
            dark gold on paper. */}
        <h1 className="font-display text-3xl leading-none font-extrabold tracking-wide break-words text-[var(--volt-text)] uppercase sm:text-4xl">
          @{profile.username}
        </h1>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-[var(--color-blue)]/50 px-4 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10"
          >
            Edit
          </button>
        ) : null}
      </div>
      {email ? <p className="mt-1 text-sm text-[var(--color-bone)]/55">{email}</p> : null}
      {profile.bio ? (
        <p className="mt-2 whitespace-pre-wrap text-[var(--color-bone)]/80">{profile.bio}</p>
      ) : null}
    </>
  );
}

// Skill / Position / Years playing / Home court. Rendered below the divider.
function ProfileStats({ profile }: { profile: PublicProfileRow }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
      <Item label="Skill" value={profile.skill_level} />
      <Item label="Position" value={profile.preferred_position} />
      <Item
        label="Years playing"
        value={profile.years_playing != null ? String(profile.years_playing) : null}
      />
      <Item
        label="Home court"
        value={profile.home_court_id != null ? `Court #${profile.home_court_id}` : null}
      />
    </dl>
  );
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[var(--color-bone)]/55 uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-[var(--color-bone)]">{value ?? '-'}</dd>
    </div>
  );
}

function SettingsPanel({
  notificationsEnabled,
  onToggleNotifications,
  onChangePassword,
  onDeleteAccount,
}: {
  notificationsEnabled: boolean;
  onToggleNotifications: (value: boolean) => void;
  onChangePassword: (() => void) | null;
  onDeleteAccount: () => void;
}) {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="font-mono text-xs font-semibold tracking-[0.22em] text-[var(--color-bone)]/55 uppercase">
          Appearance
        </h3>
        <p className="mt-2 text-sm text-[var(--color-bone)]/70">
          Choose how HoopUp looks. Your choice is saved on this device.
        </p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-bone)]">
            Theme
            <span className="rounded-full bg-[var(--color-volt)]/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--color-bone)]/80">
              {isLight ? 'Light' : 'Dark'}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isLight}
            aria-label="Switch between light and dark theme"
            onClick={toggle}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              isLight ? 'bg-[var(--color-volt)]' : 'bg-[var(--border-strong)]'
            }`}
          >
            <span
              className={`absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full transition-transform ${
                isLight
                  ? 'translate-x-5 bg-white text-[var(--color-volt)]'
                  : 'translate-x-0 bg-white text-[#1f1a15]'
              }`}
            >
              {isLight ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
                  <path d="M20.4 14.7A8.6 8.6 0 0 1 9.3 3.6a8.6 8.6 0 1 0 11.1 11.1Z" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="font-mono text-xs font-semibold tracking-[0.22em] text-[var(--color-bone)]/55 uppercase">
          Notifications
        </h3>
        <p className="mt-2 text-sm text-[var(--color-bone)]/70">
          Get notified when a friend hosts a game or sends you a friend request.
        </p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-[var(--color-bone)]">Friend activity</span>
          <button
            type="button"
            role="switch"
            aria-checked={notificationsEnabled}
            aria-label="Toggle friend-activity notifications"
            onClick={() => onToggleNotifications(!notificationsEnabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              notificationsEnabled ? 'bg-[var(--color-volt)]' : 'bg-[var(--border-strong)]'
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-5 w-5 rounded-full transition-transform ${
                notificationsEnabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white'
              }`}
            />
          </button>
        </div>
      </div>

      {onChangePassword ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="font-mono text-xs font-semibold tracking-[0.22em] text-[var(--color-bone)]/55 uppercase">
            Security
          </h3>
          <p className="mt-2 text-sm text-[var(--color-bone)]/70">
            Update the password you use to sign in.
          </p>
          <button
            type="button"
            onClick={onChangePassword}
            className="mt-3 rounded-full border border-[var(--color-blue)]/50 px-4 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10"
          >
            Change password
          </button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5">
        <h3 className="font-mono text-xs font-semibold tracking-[0.22em] text-red-300 uppercase">
          Account
        </h3>
        <p className="mt-2 text-sm text-red-300/80">
          Permanently delete your account and all of your sessions, RSVPs, and profile data. This
          cannot be undone.
        </p>
        <button
          type="button"
          onClick={onDeleteAccount}
          className="mt-3 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
