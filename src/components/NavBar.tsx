import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';

export default function NavBar() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  async function onSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-ink)]/10 bg-[var(--color-chalk)]/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="text-2xl font-black uppercase tracking-tight text-[var(--color-court)]"
        >
          Hoop<span className="text-[var(--color-ink)]">Up</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {session ? (
            <>
              <Link
                to="/profile"
                className="rounded-full px-4 py-2 font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full border border-[var(--color-ink)]/20 px-4 py-2 font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-[var(--color-court)] px-4 py-2 font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
