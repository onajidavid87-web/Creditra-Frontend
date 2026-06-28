/**
 * ReducedMotionContext — manages the reduced-motion override preference.
 *
 * Design decisions:
 *  - Uses the `[data-motion="reduced"]` attribute on <html>.
 *  - Persisted via the project's `storage.ts` helpers.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { readJson, writeJson } from '../utils/storage';

export type MotionOverride = 'system' | 'reduced';

interface ReducedMotionContextValue {
  motionOverride: MotionOverride;
  toggleMotionOverride: () => void;
  setMotionOverride: (mode: MotionOverride) => void;
  /** Helper to determine if reduced motion is currently active (via OS or override) */
  isReducedMotionActive: boolean;
}

const STORAGE_KEY = 'creditra-motion-override' as const;

const ReducedMotionContext = createContext<ReducedMotionContextValue | undefined>(undefined);

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const [motionOverride, setMotionOverrideState] = useState<MotionOverride>(() =>
    readJson<MotionOverride>(STORAGE_KEY, 'system'),
  );
  
  const [osReduced, setOsReduced] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );

  useEffect(() => {
    const root = document.documentElement;
    if (motionOverride === 'reduced') {
      root.setAttribute('data-motion', 'reduced');
    } else {
      root.removeAttribute('data-motion');
    }
    writeJson<MotionOverride>(STORAGE_KEY, motionOverride);
  }, [motionOverride]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setOsReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setMotionOverride = (mode: MotionOverride) => setMotionOverrideState(mode);

  const toggleMotionOverride = () =>
    setMotionOverrideState((prev) => (prev === 'system' ? 'reduced' : 'system'));

  const isReducedMotionActive = motionOverride === 'reduced' || osReduced;

  return (
    <ReducedMotionContext.Provider
      value={{ motionOverride, toggleMotionOverride, setMotionOverride, isReducedMotionActive }}
    >
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion(): ReducedMotionContextValue {
  const ctx = useContext(ReducedMotionContext);
  if (!ctx) {
    return {
      motionOverride: 'system',
      toggleMotionOverride: () => {},
      setMotionOverride: () => {},
      isReducedMotionActive: typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
    };
  }
  return ctx;
}
