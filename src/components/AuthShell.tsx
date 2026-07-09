import type { ReactNode } from 'react';
import CourtGL from './CourtGL';

type Props = {
  /** Mono kicker line above the heading (e.g. "Welcome back"). */
  kicker: string;
  title: string;
  sub?: string;
  children: ReactNode;
};

/**
 * Shared shell for the auth screens (login, signup, reset, update): the
 * ambient floodlit-court canvas behind a glass card, with the display-type
 * heading treatment. Keeps all four pages visually identical so the forms
 * are the only thing that changes.
 */
export default function AuthShell({ kicker, title, sub, children }: Props) {
  return (
    <main className="relative flex min-h-[calc(100dvh-3.5rem)] items-center justify-center overflow-hidden bg-[var(--color-night)] px-4 py-16 text-[var(--color-bone)] sm:px-6">
      <div aria-hidden className="volt-floods absolute inset-0" />
      <CourtGL variant="ambient" className="absolute inset-0" />
      <div className="glass relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8">
        <p className="font-mono text-[11px] font-semibold tracking-[0.3em] text-[var(--volt-text)] uppercase">
          {kicker}
        </p>
        <h1 className="mt-2 font-display text-5xl font-black tracking-wide uppercase">{title}</h1>
        {sub ? <p className="mt-2.5 text-sm text-[var(--color-bone)]/65">{sub}</p> : null}
        {children}
      </div>
    </main>
  );
}
