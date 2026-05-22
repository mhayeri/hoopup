import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has stopped changing for `delayMs`. Lets a
 * fast-changing input (e.g. a search box updating on every keystroke) drive an
 * effect at most once per typing pause instead of on every character.
 *
 * 250ms is a comfortable default for search-as-you-type.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
