import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/useAuth';
import OAuthButtons from '../components/OAuthButtons';
import { friendlyMessage } from '../lib/errors';

// Only allow same-origin paths starting with a single '/'. This blocks
// protocol-relative ('//evil.com'), absolute ('https://evil.com'), and
// scheme-only ('javascript:...') values that could turn the post-login
// redirect into an open-redirect vector.
function safeReturnPath(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

// The `login` edge function returns its (already user-friendly) message in the
// JSON body on a non-2xx response. Pull it out so the user sees "Too many
// attempts..." / "Invalid email/username or password." rather than a generic
// FunctionsHttpError.
async function loginErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body && typeof body.error === 'string') return body.error;
    } catch {
      // body wasn't JSON - fall through to the default.
    }
  }
  return 'Sign in failed. Please try again.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={safeReturnPath(search.get('from'))} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Sign in through the `login` edge function: it resolves a username to its
    // email server-side (never returning the email), applies a per-IP rate
    // limit, and gives the same generic error for an unknown account and a
    // wrong password. We only ever receive session tokens back.
    const { data, error: invokeError } = await supabase.functions.invoke('login', {
      body: { identifier, password },
    });

    if (invokeError) {
      setSubmitting(false);
      setError(await loginErrorMessage(invokeError));
      return;
    }

    const { access_token, refresh_token } = (data ?? {}) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (!access_token || !refresh_token) {
      setSubmitting(false);
      setError('Sign in failed. Please try again.');
      return;
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    setSubmitting(false);
    if (sessionError) {
      setError(friendlyMessage(sessionError));
      return;
    }
    navigate(safeReturnPath(search.get('from')), { replace: true });
  }

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-volt)]">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--color-bone)]/70">Welcome back. Hit the floor.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/60">
              Email or username
            </span>
            <input
              type="text"
              required
              autoComplete="username email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-[var(--color-bone)] placeholder:text-[var(--color-bone)]/40 outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/60">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-[var(--color-bone)] placeholder:text-[var(--color-bone)]/40 outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30"
            />
          </label>

          <div className="text-right">
            <Link
              to="/reset-password"
              className="text-xs font-semibold text-[var(--color-blue)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

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
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--color-bone)]/45">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <OAuthButtons />

        <p className="mt-6 text-sm text-[var(--color-bone)]/70">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-[var(--color-blue)] hover:underline">
            Create an account
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
