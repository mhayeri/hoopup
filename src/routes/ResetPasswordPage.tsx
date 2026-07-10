import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/useAuth';
import AuthShell from '../components/AuthShell';
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
    // confirms nor denies an account - no enumeration. We only surface genuine
    // transport / rate-limit errors.
    if (resetError) {
      setError(friendlyMessage(resetError));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell kicker="Sent" title="Check your email">
        <p className="mt-4 text-[var(--color-bone)]/80">
          If an account exists for <strong>{email}</strong>, we've sent a link to reset your
          password. The link expires shortly, so use it soon.
        </p>
        <p className="mt-6 text-sm text-[var(--color-bone)]/55">
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-[var(--color-blue)] hover:underline">
            Back to sign in
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="No sweat"
      title="Reset password"
      sub="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <label className="block">
          <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[var(--color-bone)]/60 uppercase">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--color-bone)] placeholder:text-[var(--color-bone)]/40 outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30"
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
          className="sheen w-full rounded-full bg-[var(--color-volt)] px-6 py-3 font-semibold text-[var(--on-volt)] shadow-[0_0_22px_var(--glow-cta)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--color-bone)]/70">
        <Link to="/login" className="font-semibold text-[var(--color-blue)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
