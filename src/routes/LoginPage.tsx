import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OAuthButtons from '../components/OAuthButtons';

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

export default function LoginPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
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
