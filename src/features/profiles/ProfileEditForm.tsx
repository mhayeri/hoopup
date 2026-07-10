import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type CourtOption = { id: number; name: string | null };

type Props = {
  profile: ProfileRow;
  onSubmit: (patch: ProfileUpdate) => Promise<{ error: string | null }>;
  onCancel: () => void;
};

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'pro'] as const;
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;

export default function ProfileEditForm({ profile, onSubmit, onCancel }: Props) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [skillLevel, setSkillLevel] = useState(profile.skill_level ?? '');
  const [position, setPosition] = useState(profile.preferred_position ?? '');
  const [yearsPlaying, setYearsPlaying] = useState(
    profile.years_playing != null ? String(profile.years_playing) : ''
  );
  const [homeCourtId, setHomeCourtId] = useState(
    profile.home_court_id != null ? String(profile.home_court_id) : ''
  );

  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('courts')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (!cancelled) setCourts(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (username.length < 3 || username.length > 20) {
      setError('Username must be between 3 and 20 characters.');
      return;
    }
    if (bio.length > 500) {
      setError('Bio cannot exceed 500 characters.');
      return;
    }
    const yearsPlayingNum = yearsPlaying === '' ? null : Number(yearsPlaying);
    if (yearsPlayingNum != null && (Number.isNaN(yearsPlayingNum) || yearsPlayingNum < 0)) {
      setError('Years playing must be a non-negative number.');
      return;
    }

    const patch: ProfileUpdate = {
      username: username.trim().toLowerCase(),
      bio: bio.trim() || null,
      skill_level: skillLevel === '' ? null : (skillLevel as (typeof SKILL_LEVELS)[number]),
      preferred_position: position === '' ? null : (position as (typeof POSITIONS)[number]),
      years_playing: yearsPlayingNum,
      home_court_id: homeCourtId === '' ? null : Number(homeCourtId),
    };

    setSubmitting(true);
    const { error } = await onSubmit(patch);
    setSubmitting(false);
    if (error) setError(error);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Username">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          minLength={3}
          maxLength={20}
          required
          className={inputClass}
        />
        <Hint>3-20 characters, lowercase. Must be unique.</Hint>
      </Field>

      <Field label="Bio">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          className={inputClass}
        />
        <Hint>{bio.length}/500</Hint>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Skill level">
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            className={inputClass}
          >
            <option value="">-</option>
            {SKILL_LEVELS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Position">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className={inputClass}
          >
            <option value="">-</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Years playing">
        <input
          type="number"
          min={0}
          max={80}
          value={yearsPlaying}
          onChange={(e) => setYearsPlaying(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Home court">
        <select
          value={homeCourtId}
          onChange={(e) => setHomeCourtId(e.target.value)}
          className={inputClass}
        >
          <option value="">- pick one -</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? `Court #${c.id}`}
            </option>
          ))}
        </select>
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
          {submitting ? 'Saving…' : 'Save'}
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

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--color-bone)] placeholder:text-[var(--color-bone)]/40 outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/30';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-bone)]/80">{label}</span>
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-xs text-[var(--color-bone)]/55">{children}</span>;
}
