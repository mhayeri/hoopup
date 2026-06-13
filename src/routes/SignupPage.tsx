import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/useAuth';
import OAuthButtons from '../components/OAuthButtons';
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
      <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-volt)]">
            Check your email
          </h1>
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
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-volt)]">
          Sign up
        </h1>
        <p className="mt-2 text-sm text-[var(--color-bone)]/70">Get on the floor.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/60">
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
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/60">
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
            className="w-full rounded-full bg-[var(--color-volt)] px-6 py-3 font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--color-bone)]/45">
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
      </div>
    </main>
  );
}
