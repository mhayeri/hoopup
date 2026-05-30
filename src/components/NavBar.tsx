import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import PlayerSearchOverlay from '../features/friends/PlayerSearchOverlay';
import MobileNavMenu from './MobileNavMenu';

export default function NavBar() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function onSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[var(--color-night)]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="text-2xl font-black uppercase tracking-tight text-[var(--color-bone)]"
        >
          Hoop<span className="text-[var(--color-volt)]">Up</span>
        </Link>
        <div className="hidden items-center gap-2 text-sm sm:flex">
          <Link
            to="/map"
            className="rounded-full px-4 py-2 font-semibold text-[var(--color-bone)]/75 transition hover:bg-white/8 hover:text-[var(--color-bone)]"
          >
            Map
          </Link>
          {session ? (
            <>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Find players"
                title="Find players"
                className="rounded-full p-2 text-[var(--color-bone)]/75 transition hover:bg-white/8 hover:text-[var(--color-bone)]"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <Link
                to="/profile"
                className="rounded-full px-4 py-2 font-semibold text-[var(--color-bone)]/75 transition hover:bg-white/8 hover:text-[var(--color-bone)]"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full border border-white/15 px-4 py-2 font-semibold text-[var(--color-bone)] transition hover:border-[var(--color-blue)]/60 hover:bg-[var(--color-blue)]/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 font-semibold text-[var(--color-bone)]/75 transition hover:bg-white/8 hover:text-[var(--color-bone)]"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-[var(--color-volt)] px-4 py-2 font-semibold text-[#0c1402] shadow-[0_0_20px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          className="rounded-full p-2 text-[var(--color-bone)] transition hover:bg-white/8 sm:hidden"
        >
          {menuOpen ? (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </nav>
      <MobileNavMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        authed={!!session}
        onSignOut={onSignOut}
        onOpenSearch={() => setSearchOpen(true)}
      />
      {session ? (
        <PlayerSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      ) : null}
    </header>
  );
}
