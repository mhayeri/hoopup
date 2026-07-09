import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';

type RevealTag = 'div' | 'section' | 'span' | 'li' | 'p' | 'header' | 'footer';

type Props = {
  children: ReactNode;
  /** Stagger offset in ms, applied via the --reveal-delay custom property. */
  delay?: number;
  className?: string;
  as?: RevealTag;
};

/* One shared IntersectionObserver for every Reveal on the page. Each element
   reveals once and is immediately unobserved. */
const pending = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | null = null;

function observe(el: Element, onReveal: () => void) {
  if (typeof IntersectionObserver === 'undefined') {
    onReveal();
    return () => {};
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        pending.get(entry.target)?.();
        pending.delete(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -32px 0px' },
  );
  pending.set(el, onReveal);
  observer.observe(el);
  return () => {
    pending.delete(el);
    observer?.unobserve(el);
  };
}

/**
 * Scroll-reveal wrapper: children rise, sharpen and fade in the first time
 * they enter the viewport (CSS `.reveal` in index.css). Reduced-motion users
 * see content immediately — the CSS media query neutralizes the transition,
 * so nothing here depends on JS timing.
 */
export default function Reveal({ children, delay = 0, className = '', as = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observe(el, () => setShown(true));
  }, []);

  return createElement(
    as,
    {
      ref,
      className: `reveal ${shown ? 'is-revealed' : ''} ${className}`.trim(),
      style: delay ? { '--reveal-delay': `${delay}ms` } : undefined,
    },
    children,
  );
}
