import { useState } from 'react';
import { useAuth } from '../providers/useAuth';
import { useProfile } from '../features/profiles/useProfile';
import ProfileEditForm from '../features/profiles/ProfileEditForm';
import AvatarUpload from '../features/profiles/AvatarUpload';
import ChangePasswordForm from '../features/profiles/ChangePasswordForm';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, error, updateProfile, refresh } = useProfile(user?.id);
  const [editing, setEditing] = useState(false);
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
    <main className="mx-auto max-w-2xl px-6 py-12">
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

      {hasEmailAuth ? (
        <div className="mt-8 rounded-3xl border border-[var(--color-ink)]/10 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-black uppercase tracking-tight text-[var(--color-ink)]">
            Change password
          </h2>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </div>
      ) : null}
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
      <div className="flex items-baseline justify-between gap-4">
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
