import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  /** Animation length in ms. */
  duration?: number;
  className?: string;
};

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Rolls a number up from 0 the first time it scrolls into view (ease-out expo,
 * rAF-driven). Pair with the mono font + tabular-nums so digits don't jitter.
 * Reduced-motion users see the final value immediately.
 */
export default function CountUp({ value, duration = 1100, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(reducedMotion ? value : 0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const run = () => {
      if (started.current) return;
      started.current = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / duration, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(Math.round(value * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (typeof IntersectionObserver === 'undefined') {
      run();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  // If the underlying value changes after the intro animation, track it directly.
  useEffect(() => {
    if (started.current) setDisplay(value);
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
    </span>
  );
}
