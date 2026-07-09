import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { friendlyMessage } from '../../lib/errors';
import { PASSWORD_HINT, validatePassword } from '../../lib/password';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--color-bone)] placeholder:text-[var(--color-bone)]/40 outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30';

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setSubmitting(false);

    if (updateError) {
      setError(friendlyMessage(updateError));
      return;
    }

    setSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-[var(--color-bone)]/80">New password</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-[var(--color-bone)]/55">{PASSWORD_HINT}</span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[var(--color-bone)]/80">Confirm password</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          role="status"
          className="rounded-md border border-[var(--color-volt)]/40 bg-[var(--color-volt)]/10 px-3 py-2 text-sm text-[var(--volt-text)]"
        >
          Password updated successfully.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[var(--color-volt)] px-6 py-2 font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Updating...' : 'Update password'}
      </button>
    </form>
  );
}
