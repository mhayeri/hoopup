import { useAuth } from '../providers/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-court)]">
        Your profile
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink)]/70">
        Signed in as <span className="font-semibold">{user?.email ?? 'unknown'}</span>.
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--color-ink)]/10 bg-white p-6">
        <p className="text-[var(--color-ink)]/80">
          Bio, skill level, position, years playing, and home court fields land in the next branch.
        </p>
      </div>
    </main>
  );
}
