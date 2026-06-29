/**
 * ThemeContext — manages the colour-scheme preference (light / dark / system).
 *
 * Currently only 'default' (dark) is implemented.  The 'light' variant and a
 * 'system' auto-detect option are planned for a future iteration.
 *
 * Persisted via the project's `storage.ts` helpers rather than raw
 * localStorage calls, which are not safe in all browsing environments.
 *
 * For the high-contrast override see `ContrastContext.tsx`.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { readJson, writeJson } from '../utils/storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Theme = 'default';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const THEME_STORAGE_KEY = 'creditra-theme' as const;

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    readJson<Theme>(THEME_STORAGE_KEY, 'default'),
  );

  useEffect(() => {
    // Theme is applied as a class on <html> so Tailwind utilities can target it.
    const root = document.documentElement;
    root.classList.remove('theme-default');
    root.classList.add(`theme-${theme}`);
    writeJson<Theme>(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next: Theme) => setThemeState(next);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/** Returns the current theme context. Must be used inside a `<ThemeProvider>`. */
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
