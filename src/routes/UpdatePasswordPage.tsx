import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/useAuth';
import { friendlyMessage } from '../lib/errors';
import { PASSWORD_HINT, validatePassword } from '../lib/password';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--color-bone)] placeholder:text-[var(--color-bone)]/40 outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30';

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
      <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-volt)]">
            Password updated
          </h1>
          <p className="mt-4 text-[var(--color-bone)]/80">You're all set. Back on the floor.</p>
          <button
            type="button"
            onClick={() => navigate('/profile', { replace: true })}
            className="mt-6 rounded-full bg-[var(--color-volt)] px-5 py-2 text-sm font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90"
          >
            Go to profile
          </button>
        </div>
      </main>
    );
  }

  // No recovery session - expired/invalid link.
  if (!loading && !session) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-volt)]">
            Link expired
          </h1>
          <p className="mt-4 text-[var(--color-bone)]/80">
            This password-reset link is missing or has expired. Request a fresh one.
          </p>
          <Link
            to="/reset-password"
            className="mt-6 inline-block rounded-full bg-[var(--color-volt)] px-5 py-2 text-sm font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-volt)]">
          New password
        </h1>
        <p className="mt-2 text-sm text-[var(--color-bone)]/70">
          Choose a new password for your account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/60">
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
            <span className="mt-1 block text-xs text-[var(--color-bone)]/55">{PASSWORD_HINT}</span>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/60">
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
              className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[var(--color-volt)] px-6 py-3 font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  );
}
