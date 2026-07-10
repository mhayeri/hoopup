type Props = {
  className?: string;
};

/** The HoopUp ball glyph — a seamed basketball drawn with strokes so it
 *  inherits currentColor. Used by the navbar wordmark and the footer. */
export default function BallMark({ className = 'h-6 w-6' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.4" />
      <path d="M2.6 12h18.8" />
      <path d="M12 2.6v18.8" />
      <path d="M5.4 5.4c4.1 3.6 4.1 9.6 0 13.2" />
      <path d="M18.6 5.4c-4.1 3.6-4.1 9.6 0 13.2" />
    </svg>
  );
}
