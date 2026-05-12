import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/useAuth';
import { friendlyMessage } from '../lib/errors';

/**
 * Lands here after OAuth redirect or email confirmation. Two ways the URL
 * arrives:
 *   - PKCE flow with ?code=... appended (new OAuth providers)
 *   - URL fragment with access_token=... (legacy / email-link)
 *
 * The Supabase client's detectSessionInUrl handles the fragment case
 * automatically. We call exchangeCodeForSession explicitly for the PKCE
 * case because HashRouter shoves the code inside our route hash, where
 * the implicit handler sometimes misses it.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = window.location.href;
    if (url.includes('code=')) {
      supabase.auth.exchangeCodeForSession(url).catch((e: unknown) => {
        setError(friendlyMessage(e instanceof Error ? e : null));
      });
    }
  }, []);

  useEffect(() => {
    if (!loading && session) {
      navigate('/', { replace: true });
    }
  }, [loading, session, navigate]);

  if (error) {
    return (
      <main className="flex min-h-full items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-court)]">
            Couldn't sign you in
          </h1>
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[var(--color-hardwood)]">
          Lacing up…
        </p>
        <p className="mt-4 text-[var(--color-ink)]/70">Finishing sign-in.</p>
      </div>
    </main>
  );
}
