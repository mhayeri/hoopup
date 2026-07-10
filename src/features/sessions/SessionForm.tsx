import { useState, type FormEvent } from 'react';
import {
  toDatetimeLocalValue,
  roundToNearestQuarterHour,
  combineDateTime,
  TIME_SLOTS,
} from './formatTime';

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
  d.setMinutes(d.getMinutes() + 30);
  return roundToNearestQuarterHour(d);
}

/** Splits a Date into the `<input type="date">` value + the `HH:mm` time-slot
 * key, snapping to the 15-minute grid so the `<select>` always has a match. */
function toDateAndSlot(d: Date): [string, string] {
  const [date, time] = toDatetimeLocalValue(roundToNearestQuarterHour(d)).split('T');
  return [date, time];
}

export default function SessionForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const initialStart = initial?.startsAt ? new Date(initial.startsAt) : defaultStart();
  const initialEnd = initial?.endsAt
    ? new Date(initial.endsAt)
    : new Date(initialStart.getTime() + DEFAULT_DURATION_MIN * 60_000);

  const [initialStartDate, initialStartTime] = toDateAndSlot(initialStart);
  const [initialEndDate, initialEndTime] = toDateAndSlot(initialEnd);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const todayStr = toDatetimeLocalValue(new Date()).split('T')[0];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const start = combineDateTime(startDate, startTime);
    const end = combineDateTime(endDate, endTime);
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
      <DateTimeField
        label="Starts"
        date={startDate}
        time={startTime}
        minDate={todayStr}
        onDateChange={setStartDate}
        onTimeChange={setStartTime}
      />

      <DateTimeField
        label="Ends"
        date={endDate}
        time={endTime}
        minDate={startDate}
        onDateChange={setEndDate}
        onTimeChange={setEndTime}
      />

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Skill level, who's bringing the ball, anything else..."
          className={inputClass}
        />
        <Hint>{notes.length}/500</Hint>
      </Field>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[var(--color-volt)] px-6 py-2 font-semibold text-[var(--on-volt)] shadow-[0_0_22px_var(--glow-cta)] transition hover:bg-[var(--color-volt)]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[var(--color-blue)]/50 px-6 py-2 font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const baseControl =
  'w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--color-bone)] placeholder:text-[var(--color-bone)]/40 outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30';
const inputClass = `mt-1 ${baseControl}`;
// `appearance-none` stops iOS from sizing the native date widget to its content
// (which used to overflow the modal's padding on mobile).
const dateClass = `${baseControl} appearance-none`;
const labelClass = 'text-xs font-semibold uppercase tracking-widest text-[var(--color-bone)]/80';

/** A date `<input>` + a 15-minute time `<select>` side by side. The grid columns
 * are `minmax(0, 1fr)`, so the full-width controls can never overflow the modal. */
function DateTimeField({
  label,
  date,
  time,
  minDate,
  onDateChange,
  onTimeChange,
}: {
  label: string;
  date: string;
  time: string;
  minDate?: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <input
          type="date"
          aria-label={`${label} date`}
          value={date}
          min={minDate}
          onChange={(e) => onDateChange(e.target.value)}
          required
          className={dateClass}
        />
        <select
          aria-label={`${label} time`}
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          required
          className={baseControl}
        >
          {TIME_SLOTS.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-xs text-[var(--color-bone)]/55">{children}</span>;
}
