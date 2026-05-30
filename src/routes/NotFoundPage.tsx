import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[var(--color-bone)]/60">
          Air ball
        </p>
        <h1 className="mt-2 text-6xl font-black uppercase tracking-tight text-[var(--color-volt)]">
          404
        </h1>
        <p className="mt-4 text-[var(--color-bone)]/70">No play here. Try the home court.</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-full border border-[var(--color-blue)]/50 px-6 py-3 font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10"
        >
          Back to HoopUp
        </Link>
      </section>
    </main>
  );
}
