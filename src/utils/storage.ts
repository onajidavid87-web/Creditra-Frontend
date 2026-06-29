/**
 * Safe wrappers around `localStorage`.
 *
 * Storage can throw in private browsing modes, in iframes with strict
 * cookie policies, and when the quota is exceeded. These helpers return
 * sensible fallbacks instead of letting the exception bubble up and
 * crash the React render.
 */

/**
 * Read and JSON-parse a value from localStorage.
 *
 * Returns `fallback` if the key is missing, parsing fails, or storage is
 * unavailable.
 */
export function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * JSON-serialize a value and write it to localStorage. Silently no-ops
 * on failure.
 */
export function writeJson<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* swallow — quota or private-mode write failure */
  }
}

/** Remove a key from localStorage. Silently no-ops on failure. */
export function removeKey(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    /* swallow */
  }
}
