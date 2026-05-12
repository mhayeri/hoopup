import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { friendlyMessage } from '../../lib/errors';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--color-ink)]/20 bg-white px-3 py-2 outline-none focus:border-[var(--color-court)] focus:ring-2 focus:ring-[var(--color-court)]/20';

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

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
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
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
          New password
        </span>
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-[var(--color-ink)]/60">
          At least 8 characters.
        </span>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
          Confirm password
        </span>
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
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          role="status"
          className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800"
        >
          Password updated successfully.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[var(--color-court)] px-6 py-2 font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Updating...' : 'Update password'}
      </button>
    </form>
  );
}
