type Props = {
  className?: string;
};

/**
 * Single-player glyph (head + shoulders) used by the "Find players" search
 * affordances — the navbar trigger and the search overlay's input prefix.
 * Stroke-based to match the app's inline-SVG convention; color/size come from
 * the passed className via `currentColor`.
 */
export default function PlayerIcon({ className }: Props) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
