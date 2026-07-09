import type { CSSProperties, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Seconds for one full loop. */
  duration?: number;
  className?: string;
};

/**
 * Seamless ticker: renders the content twice inside a `max-content` track and
 * translates it -50% on loop (`.marquee` / `.marquee-track` in index.css).
 * Edges fade out via mask. Reduced motion pauses the track via CSS.
 */
export default function Marquee({ children, duration = 36, className = '' }: Props) {
  return (
    <div className={`marquee ${className}`.trim()}>
      <div
        className="marquee-track"
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
