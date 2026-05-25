import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/useAuth';
import { friendlyMessage } from '../lib/errors';
import { PASSWORD_HINT, validatePassword } from '../lib/password';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--color-ink)]/20 bg-white px-3 py-2 outline-none focus:border-[var(--color-court)] focus:ring-2 focus:ring-[var(--color-court)]/20';

/**
 * Set a new password after following a recovery link. AuthCallbackPage verifies
 * the link, establishes the (temporary) recovery session, and redirects here.
 * If there's no session by the time auth has loaded, the link was missing or
 * expired.
 */
export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(friendlyMessage(updateError));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="flex min-h-full items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-court)]">
            Password updated
          </h1>
          <p className="mt-4 text-[var(--color-ink)]/80">You're all set. Back on the floor.</p>
          <button
            type="button"
            onClick={() => navigate('/profile', { replace: true })}
            className="mt-6 rounded-full bg-[var(--color-court)] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90"
          >
            Go to profile
          </button>
        </div>
      </main>
    );
  }

  // No recovery session → expired/invalid link.
  if (!loading && !session) {
    return (
      <main className="flex min-h-full items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-court)]">
            Link expired
          </h1>
          <p className="mt-4 text-[var(--color-ink)]/80">
            This password-reset link is missing or has expired. Request a fresh one.
          </p>
          <Link
            to="/reset-password"
            className="mt-6 inline-block rounded-full bg-[var(--color-court)] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-court)]">
          New password
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink)]/70">
          Choose a new password for your account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
              New password
            </span>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-[var(--color-ink)]/60">{PASSWORD_HINT}</span>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
              Confirm password
            </span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[var(--color-court)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  );
}
