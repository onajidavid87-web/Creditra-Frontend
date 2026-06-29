import { useState, useEffect } from 'react';

/**
 * Debounces a value, returning the most recent value only after the specified delay has passed without new updates.
 * 
 * @param value The value to debounce
 * @param delay Delay in milliseconds
 * @returns The debounced value
 */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
