const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export type SessionStatus = 'cancelled' | 'active' | 'upcoming' | 'ended';

/**
 * Single source of truth for whether a session is upcoming, in-progress,
 * already over, or cancelled. Pair with `useNow()` at the call site if you
 * want the status to flip without a page refresh.
 */
export function getSessionStatus(
  s: { starts_at: string; ends_at: string; cancelled_at: string | null },
  now: Date = new Date()
): SessionStatus {
  if (s.cancelled_at) return 'cancelled';
  const t = now.getTime();
  if (t < new Date(s.starts_at).getTime()) return 'upcoming';
  if (t < new Date(s.ends_at).getTime()) return 'active';
  return 'ended';
}

/**
 * Short label for how much game is left: "ends in 35m", "ends in 1h 20m",
 * or "ending now" once we're inside the last minute. Returns "ended" if the
 * end time has already passed — callers should normally guard with
 * `getSessionStatus` first, but the fallback keeps the label safe.
 */
export function formatTimeUntilEnd(endsAt: string, now: Date = new Date()): string {
  const delta = new Date(endsAt).getTime() - now.getTime();
  if (delta <= 0) return 'ended';
  if (delta < MINUTE_MS) return 'ending now';
  if (delta < HOUR_MS) return `ends in ${Math.round(delta / MINUTE_MS)}m`;
  const hours = Math.floor(delta / HOUR_MS);
  const minutes = Math.round((delta - hours * HOUR_MS) / MINUTE_MS);
  return minutes === 0 ? `ends in ${hours}h` : `ends in ${hours}h ${minutes}m`;
}

/**
 * Returns a short relative label like "in 2h", "in 35m", "starting now",
 * or "ended 1d ago". Re-evaluate at the call site if you need it to tick;
 * this is a pure formatter and does not subscribe to time.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const delta = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(delta);
  if (abs < MINUTE_MS) return delta >= 0 ? 'starting now' : 'just ended';
  const future = delta > 0;
  let label: string;
  if (abs < HOUR_MS) {
    label = `${Math.round(abs / MINUTE_MS)}m`;
  } else if (abs < DAY_MS) {
    label = `${Math.round(abs / HOUR_MS)}h`;
  } else {
    label = `${Math.round(abs / DAY_MS)}d`;
  }
  return future ? `in ${label}` : `${label} ago`;
}

/** Formats an ISO timestamp as a short local date+time label. */
export function formatSessionRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${dateFmt.format(start)} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`
    : `${dateFmt.format(start)} ${timeFmt.format(start)} → ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

/**
 * Converts a Date to the `YYYY-MM-DDTHH:mm` format that `<input
 * type="datetime-local">` expects. Built-in toISOString returns UTC which
 * shifts the displayed time; this preserves the user's local clock.
 */
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Short past-relative label tailored to event timestamps like RSVPs:
 * "just now", "5m ago", "2h ago", "3d ago". For timestamps in the future
 * (shouldn't happen for created_at but defended), falls back to "just now".
 */
export function relativePastTime(iso: string, now: Date = new Date()): string {
  const delta = now.getTime() - new Date(iso).getTime();
  if (delta < MINUTE_MS) return 'just now';
  if (delta < HOUR_MS) return `${Math.round(delta / MINUTE_MS)}m ago`;
  if (delta < DAY_MS) return `${Math.round(delta / HOUR_MS)}h ago`;
  return `${Math.round(delta / DAY_MS)}d ago`;
}

/** Formats an ISO timestamp as "Mon May 11, 2:34 PM" in the local timezone. */
export function formatAbsoluteDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Short day-aware label for session list rows: "Today · 6:30 PM",
 * "Tomorrow · 5:30 PM", or "Sat · 10:00 AM" for anything else. The day
 * comparison uses local-time calendar dates so a session at 11pm today and
 * one at 1am tomorrow render as different days, matching user expectation.
 */
export function formatPanelTime(iso: string, now: Date = new Date()): string {
  const when = new Date(iso);
  const timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const time = timeFmt.format(when);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(when.getFullYear(), when.getMonth(), when.getDate());
  const dayDelta = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (dayDelta === 0) return `Today · ${time}`;
  if (dayDelta === 1) return `Tomorrow · ${time}`;
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(when);
  return `${weekday} · ${time}`;
}
