type Props = {
  unreadCount: number;
  onOpen: () => void;
};

/**
 * Navbar bell button with a volt unread badge. Presentational — the feed and
 * the dropdown live in NavBar (which owns the single useNotifications instance).
 */
export default function NotificationBell({ unreadCount, onOpen }: Props) {
  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      title="Notifications"
      className="relative rounded-full p-2 text-[var(--color-bone)]/75 transition hover:bg-white/8 hover:text-[var(--color-bone)]"
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
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--color-night)] bg-[var(--color-volt)] px-1 text-[10px] font-extrabold leading-none text-[#0c1402]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
