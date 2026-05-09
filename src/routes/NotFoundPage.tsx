import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[var(--color-hardwood)]">
          Air ball
        </p>
        <h1 className="mt-2 text-6xl font-black uppercase tracking-tight text-[var(--color-court)]">
          404
        </h1>
        <p className="mt-4 text-[var(--color-ink)]/70">No play here. Try the home court.</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-full border border-[var(--color-ink)]/20 px-6 py-3 font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
        >
          Back to HoopUp
        </Link>
      </section>
    </main>
  );
}
