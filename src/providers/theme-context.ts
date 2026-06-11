import { createContext } from 'react';

export type Theme = 'light' | 'dark';

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

/** localStorage key the no-flash bootstrap script (index.html) reads/writes. */
export const THEME_STORAGE_KEY = 'hoopup.theme';
