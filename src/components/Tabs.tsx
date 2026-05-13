import { useRef, type KeyboardEvent } from 'react';

export type TabItem = {
  id: string;
  label: string;
};

type Props = {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
};

export default function Tabs({ items, value, onChange, ariaLabel }: Props) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + delta + items.length) % items.length;
    const next = items[nextIndex];
    onChange(next.id);
    buttonsRef.current[nextIndex]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1 border-b border-[var(--color-ink)]/10 pb-2"
    >
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`tabpanel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={
              selected
                ? 'rounded-full bg-[var(--color-court)] px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-[var(--color-court)]/30'
                : 'rounded-full px-4 py-1.5 text-sm font-semibold text-[var(--color-ink)]/70 transition hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]'
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
