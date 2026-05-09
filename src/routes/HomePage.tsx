import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <section className="max-w-2xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-[var(--color-hardwood)]">
          Pickup, organized.
        </p>
        <h1 className="text-7xl font-black uppercase leading-[0.9] tracking-tight text-[var(--color-court)] md:text-8xl">
          Hoop
          <span className="text-[var(--color-ink)]">Up</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-[var(--color-ink)]/80">
          Find a court near you, RSVP to a game, and show up knowing exactly who's running with you.
          Sessions cap at 15 — first come, first hooped.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link
            to="/signup"
            className="rounded-full bg-[var(--color-court)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--color-court)]/30 transition hover:scale-[1.02] hover:bg-[var(--color-court)]/90"
          >
            Create an account
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-[var(--color-ink)]/20 px-6 py-3 font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)]/5"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
