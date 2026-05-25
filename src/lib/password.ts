// Client-side password rule, kept in sync with the Supabase auth config
// (`minimum_password_length = 8` + `password_requirements =
// "lower_upper_letters_digits"` in supabase/config.toml). Validating here gives
// a fast, specific error; the server enforces the same rule as the real gate.

export const PASSWORD_HINT =
  'At least 8 characters, including upper- and lower-case letters and a number.';

/** Returns an error message, or null when the password satisfies the rule. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-z]/.test(password)) return 'Password must include a lower-case letter.';
  if (!/[A-Z]/.test(password)) return 'Password must include an upper-case letter.';
  if (!/[0-9]/.test(password)) return 'Password must include a number.';
  return null;
}
