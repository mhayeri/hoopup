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
      className="flex flex-wrap gap-x-6 gap-y-1 border-b border-[var(--border)]"
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
            className={`relative px-1 pb-3 font-mono text-xs font-semibold tracking-[0.18em] uppercase transition ${
              selected
                ? 'text-[var(--color-bone)] after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:rounded-full after:bg-[var(--color-volt)] after:shadow-[0_0_8px_var(--color-volt)]'
                : 'text-[var(--color-bone)]/55 hover:text-[var(--color-bone)]'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
