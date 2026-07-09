import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/useAuth';
import { friendlyMessage } from '../lib/errors';

const TIMEOUT_MS = 20_000;
const OTP_TYPES: ReadonlySet<EmailOtpType> = new Set([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

/**
 * Lands here after OAuth, email confirmation, or password recovery. Three
 * URL shapes can arrive (all *inside* the hash because HoopUp uses
 * HashRouter):
 *   - PKCE:   #/auth/callback?code=...
 *   - OTP:    #/auth/callback?token_hash=...&type=signup
 *   - Legacy: #access_token=...&refresh_token=... (auto-handled by
 *             detectSessionInUrl before this component renders)
 *
 * The hash placement is what makes this fiddly - window.location.search is
 * empty, so we parse the query suffix from window.location.hash ourselves.
 */
function readAuthParams(): URLSearchParams {
  const merged = new URLSearchParams();
  const add = (raw: string) => {
    const p = new URLSearchParams(raw);
    p.forEach((v, k) => {
      if (!merged.has(k)) merged.set(k, v);
    });
  };

  const search = window.location.search.replace(/^\?/, '');
  if (search) add(search);

  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex !== -1) add(hash.substring(qIndex + 1));

  // Implicit-grant tokens land after a SECOND `#` inside the hash, e.g.
  //   /#/auth/callback#access_token=...&refresh_token=...&token_type=bearer
  // Browsers treat everything after the first `#` as one fragment, so the
  // tokens end up inside window.location.hash with no `?` separating them.
  const secondHash = hash.indexOf('#', 1);
  if (secondHash !== -1) add(hash.substring(secondHash + 1));

  return merged;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);
  // Password-recovery links land here too; once the session is established we
  // send the user to /update-password instead of home. The `flow=recovery`
  // marker (added by ResetPasswordPage) survives in the route hash regardless
  // of flow type; `type=recovery` is the implicit-flow fallback.
  const recoveryRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = readAuthParams();
    recoveryRef.current = params.get('flow') === 'recovery' || params.get('type') === 'recovery';

    // If a session already exists when we land here (e.g. user re-opens the
    // confirmation link after already verifying), just go on.
    if (!loading && session) {
      navigate(recoveryRef.current ? '/update-password' : '/', { replace: true });
      return;
    }

    const code = params.get('code');
    const tokenHash = params.get('token_hash');
    const typeParam = params.get('type');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    async function run() {
      if (code) {
        const { error: e } = await supabase.auth.exchangeCodeForSession(code);
        if (e) throw e;
        return;
      }
      if (tokenHash && typeParam && OTP_TYPES.has(typeParam as EmailOtpType)) {
        const { error: e } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: typeParam as EmailOtpType,
        });
        if (e) throw e;
        return;
      }
      if (accessToken && refreshToken) {
        const { error: e } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (e) throw e;
        return;
      }
      throw new Error(
        'No verification token found in the link. Try signing in or request a new link.'
      );
    }

    const timeoutId = window.setTimeout(() => {
      setError(
        "We couldn't finish signing you in within 20 seconds. Try signing in directly or request a new link."
      );
    }, TIMEOUT_MS);

    run()
      .catch((e: unknown) => {
        console.error('[HoopUp] Auth callback failed:', e);
        const message = e instanceof Error ? e.message : String(e ?? '');
        setError(message || friendlyMessage(null));
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => window.clearTimeout(timeoutId);
  }, [loading, session, navigate]);

  // Once a session is established, clean the URL and head on - to
  // /update-password for a recovery flow, otherwise home.
  useEffect(() => {
    if (!loading && session) {
      window.history.replaceState({}, '', `${import.meta.env.BASE_URL}#/`);
      navigate(recoveryRef.current ? '/update-password' : '/', { replace: true });
    }
  }, [loading, session, navigate]);

  if (error) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
        <div className="max-w-md text-center">
          <h1 className="font-display text-4xl font-black tracking-wide text-[var(--color-bone)] uppercase">
            Couldn't sign you in
          </h1>
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="rounded-full bg-[var(--color-volt)] px-5 py-2 text-sm font-semibold text-[#0c1402] shadow-[0_0_22px_rgba(200,255,45,0.35)] transition hover:bg-[var(--color-volt)]/90"
            >
              Sign in
            </Link>
            <Link
              to="/"
              className="rounded-full border border-[var(--color-blue)]/50 px-5 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10"
            >
              Go home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
      <div className="text-center">
        <p className="font-mono text-sm font-semibold tracking-[0.4em] text-[var(--color-bone)]/60 uppercase">
          Lacing up...
        </p>
        <p className="mt-4 text-[var(--color-bone)]/70">Finishing sign-in.</p>
      </div>
    </main>
  );
}
