import { useRef, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. Keep small — this should feel like glass, not a gimbal. */
  maxTilt?: number;
  /** Spotlight ring color (any CSS color). Defaults to a soft white. */
  spotColor?: string;
};

const finePointer =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Pointer-tracked 3D tilt with a spotlight border (`.spot-border` in
 * index.css). Writes transforms straight to the DOM node — no re-renders per
 * pointer move. Touch and reduced-motion users get a static card.
 */
export default function TiltCard({ children, className = '', maxTilt = 6, spotColor }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !finePointer) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * maxTilt).toFixed(2)}deg) rotateY(${((x - 0.5) * maxTilt).toFixed(2)}deg)`;
      el.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
    });
  }

  function onEnter() {
    const el = ref.current;
    if (!el || !finePointer) return;
    el.style.transition = 'transform 0.12s ease-out';
    window.setTimeout(() => {
      if (el) el.style.transition = 'transform 0.05s linear';
    }, 130);
  }

  function onLeave() {
    const el = ref.current;
    if (!el || !finePointer) return;
    cancelAnimationFrame(frame.current);
    el.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = 'perspective(900px)';
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className={`tilt-card relative will-change-transform ${className}`.trim()}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
      <span
        aria-hidden
        className="spot-border"
        style={spotColor ? ({ '--spot-color': spotColor } as CSSProperties) : undefined}
      />
    </div>
  );
}
