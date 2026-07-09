import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import PlayerSearchBar from '../features/friends/PlayerSearchBar';
import PlayerSearchOverlay from '../features/friends/PlayerSearchOverlay';
import NotificationBell from '../features/notifications/NotificationBell';
import NotificationsPanel from '../features/notifications/NotificationsPanel';
import { useNotifications } from '../features/notifications/useNotifications';
import BallMark from './BallMark';
import MobileNavMenu from './MobileNavMenu';

/** Shared NavLink styling — quiet by default, bone on hover, volt underline
 *  bar (sitting on the header's bottom border) when the route is active. */
function navLinkClass({ isActive }: { isActive: boolean }) {
  return `relative rounded-full px-4 py-2 font-semibold transition hover:bg-[var(--hover)] ${
    isActive
      ? 'text-[var(--color-bone)] after:absolute after:inset-x-4 after:-bottom-[13px] after:h-[2px] after:rounded-full after:bg-[var(--color-volt)] after:shadow-[0_0_8px_var(--color-volt)]'
      : 'text-[var(--color-bone)]/70 hover:text-[var(--color-bone)]'
  }`;
}

export default function NavBar() {
  const { session, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Mounted once here so the poll interval and unread count are app-wide
  // singletons; the bell and the dropdown both read from this instance.
  const notifs = useNotifications(user?.id);

  async function onSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--color-night)]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="group flex items-center gap-2 text-2xl font-black tracking-tight text-[var(--color-bone)] uppercase"
        >
          <BallMark className="h-[22px] w-[22px] text-[var(--color-volt)] transition-transform duration-700 ease-out group-hover:rotate-[360deg]" />
          <span className="font-display text-[26px] tracking-wide">
            Hoop<span className="text-[var(--color-volt)]">Up</span>
          </span>
        </Link>
        <div className="hidden items-center gap-1.5 text-sm sm:flex">
          {session ? <PlayerSearchBar /> : null}
          <NavLink to="/map" className={navLinkClass}>
            Map
          </NavLink>
          {session ? (
            <>
              <NotificationBell
                unreadCount={notifs.unreadCount}
                onOpen={() => setNotifOpen(true)}
              />
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
              <button
                type="button"
                onClick={onSignOut}
                className="ml-1 rounded-full border border-[var(--border-strong)] px-4 py-2 font-semibold text-[var(--color-bone)] transition hover:border-[var(--color-blue)]/60 hover:bg-[var(--color-blue)]/10 active:scale-[0.97]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Sign in
              </NavLink>
              <Link
                to="/signup"
                className="sheen ml-1 rounded-full bg-[var(--color-volt)] px-4 py-2 font-semibold text-[#0c1402] shadow-[0_0_20px_rgba(200,255,45,0.35)] transition hover:scale-[1.03] active:scale-[0.97]"
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
          className="rounded-full p-2 text-[var(--color-bone)] transition hover:bg-[var(--hover)] sm:hidden"
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
        onOpenNotifications={() => setNotifOpen(true)}
        unreadCount={notifs.unreadCount}
      />
      {session ? (
        <>
          <PlayerSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
          <NotificationsPanel
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            notifications={notifs.notifications}
            loading={notifs.loading}
            error={notifs.error}
            markAllRead={notifs.markAllRead}
            remove={notifs.remove}
          />
        </>
      ) : null}
    </header>
  );
}
