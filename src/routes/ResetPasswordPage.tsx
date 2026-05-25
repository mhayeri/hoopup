import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/useAuth';
import { friendlyMessage } from '../lib/errors';

// Request a password-reset email. The `flow=recovery` marker survives in the
// route hash so AuthCallbackPage can route the user to /update-password after
// the link is verified (see AuthCallbackPage).
function recoveryRedirect(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/auth/callback?flow=recovery`;
}

export default function ResetPasswordPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // A signed-in user changes their password from Settings, not here.
  if (user) return <Navigate to="/profile" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirect(),
    });
    setSubmitting(false);
    // Supabase returns success whether or not the email exists, so this neither
    // confirms nor denies an account — no enumeration. We only surface genuine
    // transport / rate-limit errors.
    if (resetError) {
      setError(friendlyMessage(resetError));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex min-h-full items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-court)]">
            Check your email
          </h1>
          <p className="mt-4 text-[var(--color-ink)]/80">
            If an account exists for <strong>{email}</strong>, we've sent a link to reset your
            password. The link expires shortly, so use it soon.
          </p>
          <p className="mt-6 text-sm text-[var(--color-ink)]/60">
            Remembered it?{' '}
            <Link to="/login" className="font-semibold text-[var(--color-court)] hover:underline">
              Back to sign in
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-court)]">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink)]/70">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-ink)]/20 bg-white px-3 py-2 outline-none focus:border-[var(--color-court)] focus:ring-2 focus:ring-[var(--color-court)]/20"
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
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--color-ink)]/70">
          <Link to="/login" className="font-semibold text-[var(--color-court)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
