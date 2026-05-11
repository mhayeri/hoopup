import { useState, type FormEvent } from 'react';
import { toDatetimeLocalValue } from './formatTime';

export type SessionFormValues = {
  startsAt: string; // ISO
  endsAt: string; // ISO
  notes: string | null;
};

type Props = {
  initial?: Partial<SessionFormValues>;
  submitLabel: string;
  onSubmit: (values: SessionFormValues) => Promise<{ error: string | null }>;
  onCancel: () => void;
};

const DEFAULT_DURATION_MIN = 90;

function defaultStart(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30, 0, 0);
  return d;
}

export default function SessionForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const initialStart = initial?.startsAt ? new Date(initial.startsAt) : defaultStart();
  const initialEnd = initial?.endsAt
    ? new Date(initial.endsAt)
    : new Date(initialStart.getTime() + DEFAULT_DURATION_MIN * 60_000);

  const [startsAtLocal, setStartsAtLocal] = useState(toDatetimeLocalValue(initialStart));
  const [endsAtLocal, setEndsAtLocal] = useState(toDatetimeLocalValue(initialEnd));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const start = new Date(startsAtLocal);
    const end = new Date(endsAtLocal);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      setError('Pick a valid start and end time.');
      return;
    }
    if (start.getTime() <= Date.now()) {
      setError('Start time must be in the future.');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setError('End time must be after the start time.');
      return;
    }
    if (notes.length > 500) {
      setError('Notes cannot exceed 500 characters.');
      return;
    }

    setSubmitting(true);
    const result = await onSubmit({
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      notes: notes.trim() === '' ? null : notes.trim(),
    });
    setSubmitting(false);
    if (result.error) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Starts">
        <input
          type="datetime-local"
          value={startsAtLocal}
          onChange={(e) => setStartsAtLocal(e.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Ends">
        <input
          type="datetime-local"
          value={endsAtLocal}
          onChange={(e) => setEndsAtLocal(e.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Skill level, who's bringing the ball, anything else…"
          className={inputClass}
        />
        <Hint>{notes.length}/500</Hint>
      </Field>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[var(--color-court)] px-6 py-2 font-semibold text-white shadow-md shadow-[var(--color-court)]/30 transition hover:bg-[var(--color-court)]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[var(--color-ink)]/20 px-6 py-2 font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--color-ink)]/20 bg-white px-3 py-2 outline-none focus:border-[var(--color-court)] focus:ring-2 focus:ring-[var(--color-court)]/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-xs text-[var(--color-ink)]/60">{children}</span>;
}
