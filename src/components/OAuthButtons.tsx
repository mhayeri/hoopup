import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Provider = 'google' | 'github';

const labels: Record<Provider, string> = {
  google: 'Continue with Google',
  github: 'Continue with GitHub',
};

export default function OAuthButtons() {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(provider: Provider) {
    setError(null);
    setPending(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}#/auth/callback`,
      },
    });
    if (error) {
      setPending(null);
      setError(error.message);
    }
    // On success the browser is redirected; no further state to handle here.
  }

  return (
    <div className="space-y-2">
      {(['google', 'github'] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => start(p)}
          disabled={pending !== null}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-ink)]/20 bg-white px-6 py-3 font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === p ? 'Redirecting…' : labels[p]}
        </button>
      ))}
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
