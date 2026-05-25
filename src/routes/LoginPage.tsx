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
// attempts…" / "Invalid email/username or password." rather than a generic
// FunctionsHttpError.
async function loginErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body && typeof body.error === 'string') return body.error;
    } catch {
      // body wasn't JSON — fall through to the default.
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
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--color-court)]">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink)]/70">Welcome back. Hit the floor.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
              Email or username
            </span>
            <input
              type="text"
              required
              autoComplete="username email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-ink)]/20 bg-white px-3 py-2 outline-none focus:border-[var(--color-court)] focus:ring-2 focus:ring-[var(--color-court)]/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-ink)]/20 bg-white px-3 py-2 outline-none focus:border-[var(--color-court)] focus:ring-2 focus:ring-[var(--color-court)]/20"
            />
          </label>

          <div className="text-right">
            <Link
              to="/reset-password"
              className="text-xs font-semibold text-[var(--color-court)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--color-ink)]/40">
          <span className="h-px flex-1 bg-[var(--color-ink)]/10" />
          or
          <span className="h-px flex-1 bg-[var(--color-ink)]/10" />
        </div>

        <OAuthButtons />

        <p className="mt-6 text-sm text-[var(--color-ink)]/70">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-[var(--color-court)] hover:underline">
            Create an account
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
