import { useState } from 'react';
import { useAuth } from '../providers/useAuth';
import { useProfile } from '../features/profiles/useProfile';
import ProfileEditForm from '../features/profiles/ProfileEditForm';
import AvatarUpload from '../features/profiles/AvatarUpload';
import ChangePasswordModal from '../features/profiles/ChangePasswordModal';
import DeleteAccountModal from '../features/profiles/DeleteAccountModal';
import ActiveSessionsList from '../features/profiles/ActiveSessionsList';
import Tabs, { type TabItem } from '../components/Tabs';

type TabId = 'sessions' | 'friends' | 'settings';

const TAB_ITEMS: TabItem[] = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'friends', label: 'Friends' },
  { id: 'settings', label: 'Settings' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, error, updateProfile, refresh } = useProfile(user?.id);
  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState<TabId>('sessions');
  const hasEmailAuth =
    (user?.app_metadata?.providers as string[] | undefined)?.includes('email') ?? false;

  if (loading) {
    return (
      <main className="flex min-h-full items-center justify-center px-6 py-16">
        <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-hardwood)]">Loading…</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error ?? 'Profile not found.'}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <aside className="lg:col-span-5">
          <div className="rounded-3xl border border-[var(--color-ink)]/10 bg-white p-8 shadow-sm">
            <AvatarUpload
              userId={profile.id}
              currentUrl={profile.avatar_url}
              onUploaded={async (url) => {
                await updateProfile({ avatar_url: url });
              }}
            />

            <div className="mt-6 border-t border-[var(--color-ink)]/10 pt-6">
              {editing ? (
                <ProfileEditForm
                  profile={profile}
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
              ) : (
                <ReadView
                  profile={profile}
                  onEdit={() => setEditing(true)}
                  email={user?.email ?? null}
                />
              )}
            </div>
          </div>
        </aside>

        <section className="mt-6 space-y-6 lg:col-span-7 lg:mt-0">
          <div className="rounded-3xl border border-[var(--color-ink)]/10 bg-white p-8 shadow-sm">
            <Tabs
              items={TAB_ITEMS}
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
                <p className="text-sm text-[var(--color-ink)]/60">Friends — coming soon.</p>
              ) : null}
              {tab === 'settings' ? (
                <SettingsPanel
                  onChangePassword={hasEmailAuth ? () => setPasswordOpen(true) : null}
                  onDeleteAccount={() => setDeleteOpen(true)}
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {hasEmailAuth ? (
        <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      ) : null}
      <DeleteAccountModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        username={profile.username}
      />
    </main>
  );
}

function ReadView({
  profile,
  email,
  onEdit,
}: {
  profile: NonNullable<ReturnType<typeof useProfile>['profile']>;
  email: string | null;
  onEdit: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-court)]">
          @{profile.username}
        </h1>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-[var(--color-ink)]/20 px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
        >
          Edit
        </button>
      </div>
      {email ? <p className="mt-1 text-sm text-[var(--color-ink)]/60">{email}</p> : null}

      {profile.bio ? (
        <p className="mt-4 whitespace-pre-wrap text-[var(--color-ink)]/80">{profile.bio}</p>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Item label="Skill" value={profile.skill_level} />
        <Item label="Position" value={profile.preferred_position} />
        <Item
          label="Years playing"
          value={profile.years_playing != null ? String(profile.years_playing) : null}
        />
        <Item
          label="Home court"
          value={profile.home_court_id != null ? `#${profile.home_court_id}` : null}
        />
      </dl>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[var(--color-ink)]">{value ?? '—'}</dd>
    </div>
  );
}

function SettingsPanel({
  onChangePassword,
  onDeleteAccount,
}: {
  onChangePassword: (() => void) | null;
  onDeleteAccount: () => void;
}) {
  return (
    <div className="space-y-6">
      {onChangePassword ? (
        <div className="rounded-2xl border border-[var(--color-ink)]/10 p-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-hardwood)]">
            Security
          </h3>
          <p className="mt-2 text-sm text-[var(--color-ink)]/70">
            Update the password you use to sign in.
          </p>
          <button
            type="button"
            onClick={onChangePassword}
            className="mt-3 rounded-full border border-[var(--color-ink)]/20 px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
          >
            Change password
          </button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-red-300 bg-red-50/40 p-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-red-800">Account</h3>
        <p className="mt-2 text-sm text-red-900/80">
          Permanently delete your account and all of your sessions, RSVPs, and profile data. This
          cannot be undone.
        </p>
        <button
          type="button"
          onClick={onDeleteAccount}
          className="mt-3 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-600/30 transition hover:bg-red-700"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
