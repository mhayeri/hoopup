import { Link } from 'react-router-dom';
import CourtGL from '../components/CourtGL';

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-[calc(100dvh-3.5rem)] items-center justify-center overflow-hidden bg-[var(--color-night)] px-6 py-16 text-[var(--color-bone)]">
      <div aria-hidden className="volt-floods absolute inset-0" />
      <CourtGL variant="ambient" className="absolute inset-0" />
      <section className="relative z-10 text-center">
        <p className="font-mono text-xs font-semibold tracking-[0.4em] text-[var(--color-volt)] uppercase">
          Air ball
        </p>
        <h1 className="text-outline mt-3 font-display text-[clamp(8rem,28vw,16rem)] leading-[0.8] font-black select-none">
          404
        </h1>
        <p className="mt-5 text-[var(--color-bone)]/70">No play here. Try the home court.</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-full border border-[var(--color-blue)]/50 px-6 py-3 font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10 active:scale-[0.98]"
        >
          Back to HoopUp
        </Link>
      </section>
    </main>
  );
}
