/**
 * ContrastContext — manages the high-contrast mode preference.
 *
 * Design decisions:
 *  - Uses the `[data-contrast="high"]` attribute on <html> so CSS overrides
 *    are scoped to a single attribute selector and never bleed into component
 *    internal hex values.
 *  - Persisted via the project's `storage.ts` helpers (safe localStorage
 *    wrappers) rather than raw localStorage calls.
 *  - Initialised synchronously from storage so there is no flash-of-wrong-
 *    contrast on first render.
 *  - Orthogonal to the theme (light/dark) context — the two can be combined
 *    freely.
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

export type ContrastMode = 'normal' | 'high';

interface ContrastContextValue {
  /** The active contrast mode. */
  contrastMode: ContrastMode;
  /** Toggle between 'normal' and 'high'. */
  toggleContrast: () => void;
  /** Directly set the contrast mode. */
  setContrastMode: (mode: ContrastMode) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'creditra-contrast' as const;

// ─── Context ─────────────────────────────────────────────────────────────────

const ContrastContext = createContext<ContrastContextValue | undefined>(
  undefined,
);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ContrastProvider({ children }: { children: ReactNode }) {
  const [contrastMode, setContrastModeState] = useState<ContrastMode>(() =>
    // Synchronous read so there is no flash on first paint.
    readJson<ContrastMode>(STORAGE_KEY, 'normal'),
  );

  // Apply / remove the data attribute on <html> whenever mode changes.
  useEffect(() => {
    const root = document.documentElement;
    if (contrastMode === 'high') {
      root.setAttribute('data-contrast', 'high');
    } else {
      root.removeAttribute('data-contrast');
    }
    writeJson<ContrastMode>(STORAGE_KEY, contrastMode);
  }, [contrastMode]);

  const setContrastMode = (mode: ContrastMode) => setContrastModeState(mode);

  const toggleContrast = () =>
    setContrastModeState((prev) => (prev === 'high' ? 'normal' : 'high'));

  return (
    <ContrastContext.Provider
      value={{ contrastMode, toggleContrast, setContrastMode }}
    >
      {children}
    </ContrastContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Returns the current contrast context.
 * Must be used inside a `<ContrastProvider>`.
 */
export function useContrast(): ContrastContextValue {
  const ctx = useContext(ContrastContext);
  if (!ctx) {
    throw new Error('useContrast must be used within a ContrastProvider');
  }
  return ctx;
}
