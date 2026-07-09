import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/useAuth';
import OAuthButtons from '../components/OAuthButtons';
import AuthShell from '../components/AuthShell';
import { friendlyMessage } from '../lib/errors';
import { PASSWORD_HINT, validatePassword } from '../lib/password';

export default function SignupPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}#/auth/callback`,
      },
    });
    setSubmitting(false);
    if (error) {
      setError(friendlyMessage(error));
      return;
    }
    // If confirmations are enabled, session is null until they click the link.
    if (!data.session) {
      setPendingEmail(email);
    }
    // If session is already there, AuthProvider picks it up and the home
    // page will reflect logged-in state; nothing else to do.
  }

  if (pendingEmail) {
    return (
      <AuthShell kicker="One more step" title="Check your email">
        <p className="mt-4 text-[var(--color-bone)]/80">
          We sent a confirmation link to <strong>{pendingEmail}</strong>. Click it to finish
          creating your account.
        </p>
        <p className="mt-6 text-sm text-[var(--color-bone)]/55">
          Didn't get it? Check spam, or{' '}
          <Link to="/signup" className="font-semibold text-[var(--color-blue)] hover:underline">
            try a different email
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell kicker="Join the run" title="Sign up" sub="Get on the floor.">
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
          <label className="block">
            <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[var(--color-bone)]/60 uppercase">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--color-bone)] placeholder:text-[var(--color-bone)]/40 outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30"
            />
            <span className="mt-1 block text-xs text-[var(--color-bone)]/55">{PASSWORD_HINT}</span>
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
            className="sheen w-full rounded-full bg-[var(--color-volt)] px-6 py-3 font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
      </form>

      <div className="my-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-[var(--color-bone)]/45 uppercase">
        <span className="h-px flex-1 bg-[var(--border)]" />
        or
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <OAuthButtons />

      <p className="mt-6 text-sm text-[var(--color-bone)]/70">
        Already have one?{' '}
        <Link to="/login" className="font-semibold text-[var(--color-blue)] hover:underline">
          Sign in
        </Link>
        .
      </p>
    </AuthShell>
  );
}
