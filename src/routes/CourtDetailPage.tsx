import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Court = Database['public']['Tables']['courts']['Row'];

export default function CourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const courtId = Number(id);
    if (!Number.isInteger(courtId) || courtId <= 0) {
      setError('Invalid court id');
      setLoading(false);
      return;
    }
    setLoading(true);
    void supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message);
        else setCourt(data ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[var(--color-hardwood)]">
          Loading court…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
        <Link
          to="/map"
          className="mt-4 inline-block text-sm font-semibold text-[var(--color-court)] hover:underline"
        >
          ← Back to map
        </Link>
      </main>
    );
  }

  if (!court) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-court)]">
          Court not found
        </h1>
        <p className="mt-3 text-[var(--color-ink)]/70">
          We couldn't find a court with that id. It may have been removed.
        </p>
        <Link
          to="/map"
          className="mt-6 inline-block text-sm font-semibold text-[var(--color-court)] hover:underline"
        >
          ← Back to map
        </Link>
      </main>
    );
  }

  const facts = [
    court.surface ? { label: 'Surface', value: court.surface } : null,
    court.hoops ? { label: 'Hoops', value: String(court.hoops) } : null,
    court.lit !== null
      ? { label: 'Lit at night', value: court.lit ? 'Yes' : 'No' }
      : null,
    {
      label: 'Coordinates',
      value: `${court.lat.toFixed(5)}, ${court.lng.toFixed(5)}`,
    },
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        to="/map"
        className="text-sm font-semibold text-[var(--color-court)] hover:underline"
      >
        ← Back to map
      </Link>
      <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-[var(--color-court)]">
        {court.name ?? 'Unnamed court'}
      </h1>

      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {facts.map((f) => (
          <div
            key={f.label}
            className="rounded-lg border border-[var(--color-ink)]/10 bg-white px-4 py-3"
          >
            <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-hardwood)]">
              {f.label}
            </dt>
            <dd className="mt-1 text-[var(--color-ink)]">{f.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ink)]">
          Upcoming sessions
        </h2>
        <p className="mt-3 text-[var(--color-ink)]/70">
          No sessions scheduled yet. Hosting will land in a follow-up.
        </p>
      </section>
    </main>
  );
}
