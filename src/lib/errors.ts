import { PG_ERROR_CODES } from './database.types';

const GENERIC_FALLBACK = 'Something went wrong. Please try again.';

// Postgres error codes
const PG_UNIQUE_VIOLATION = '23505';
const PG_PERMISSION_DENIED = '42501';

// Constraint name → user-friendly message
const CONSTRAINT_MESSAGES: Record<string, string> = {
  profiles_username_key: 'That username is already taken.',
};

// GoTrue auth error message patterns (matched against error.message)
const AUTH_MESSAGE_MAP: [pattern: RegExp, friendly: string][] = [
  [/invalid login credentials/i, 'Invalid email/username or password.'],
  [/user already registered/i, 'An account with that email already exists.'],
  [/email rate limit exceeded/i, 'Too many attempts. Please wait a moment and try again.'],
  [/email not confirmed/i, 'Please confirm your email before signing in.'],
  [
    /new password should be different/i,
    'New password must be different from your current password.',
  ],
  [/password should be at least/i, 'Password must be at least 6 characters.'],
  [/user not found/i, 'No account found with that email.'],
];

/**
 * Converts a raw Supabase / Postgres / Auth / Storage error into a
 * user-friendly message. The original error is always logged via
 * console.warn for debugging.
 */
export function friendlyMessage(
  error: { message: string; code?: string; details?: string } | Error | null | undefined
): string {
  if (!error) return GENERIC_FALLBACK;

  console.warn('[HoopUp] Original error:', error);

  const msg = error.message ?? '';
  const code = 'code' in error ? error.code : undefined;
  const details = 'details' in error ? error.details : undefined;

  // 1. Custom PG exception codes (triggers)
  if (code === PG_ERROR_CODES.SESSION_FULL) return 'This session is full.';
  if (code === PG_ERROR_CODES.SESSION_NOT_AVAILABLE) return 'This session is no longer available.';
  if (code === PG_ERROR_CODES.USERNAME_GENERATION_FAILED)
    return 'Could not generate a username. Please try again.';
  if (code === PG_ERROR_CODES.FRIENDSHIP_SELF) return 'You cannot add yourself as a friend.';
  if (code === PG_ERROR_CODES.FRIENDSHIP_DUPLICATE)
    return 'They already sent you a friend request. Check your incoming requests.';
  if (code === PG_ERROR_CODES.FRIENDSHIP_IMMUTABLE)
    return 'This friend request can no longer be changed.';

  // 2. Unique constraint violation — extract constraint name for specifics
  if (code === PG_UNIQUE_VIOLATION) {
    for (const [constraint, friendly] of Object.entries(CONSTRAINT_MESSAGES)) {
      if (details?.includes(constraint) || msg.includes(constraint)) return friendly;
    }
    return 'This value is already in use.';
  }

  // 3. Permission denied (RLS)
  if (code === PG_PERMISSION_DENIED) return "You don't have permission to do that.";

  // 4. Auth error message patterns
  for (const [pattern, friendly] of AUTH_MESSAGE_MAP) {
    if (pattern.test(msg)) return friendly;
  }

  // 5. Network / fetch failures
  if (/\bfetch\b/i.test(msg) || /\bnetwork\b/i.test(msg))
    return 'Network error. Check your connection and try again.';

  // 6. Storage payload too large
  if (msg.toLowerCase().includes('payload too large'))
    return 'File is too large. Please choose a smaller file.';

  // 7. Fallback
  return GENERIC_FALLBACK;
}
