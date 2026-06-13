import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/useAuth';
import { friendlyMessage } from '../../lib/errors';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--color-bone)] placeholder:text-[var(--color-bone)]/40 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30';

type Props = {
  username: string;
};

export default function DeleteAccountForm({ username }: Props) {
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const matches = confirmation === username;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!matches) return;
    setError(null);
    setSubmitting(true);

    const { error: invokeError } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });

    if (invokeError) {
      setSubmitting(false);
      setError(friendlyMessage(invokeError));
      return;
    }

    await signOut();
    navigate('/');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-3 text-sm text-red-300">
        <p className="font-semibold">This action is permanent.</p>
        <p className="mt-1">Deleting your account will remove:</p>
        <ul className="mt-1 list-inside list-disc">
          <li>Your profile and avatar</li>
          <li>Every session you've hosted</li>
          <li>Every RSVP you've made</li>
        </ul>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-[var(--color-bone)]/80">
          Type <span className="text-red-300">{username}</span> to confirm
        </span>
        <input
          type="text"
          required
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={username}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className={inputClass}
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
        disabled={!matches || submitting}
        className="rounded-full bg-red-600 px-6 py-2 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Deleting...' : 'Delete account permanently'}
      </button>
    </form>
  );
}
