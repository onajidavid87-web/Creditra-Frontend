import { renderHook, act } from '@testing-library/react';
import { usePrefersReducedMotion } from '../usePrefersReducedMotion';

describe('usePrefersReducedMotion', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(),
    });
  });

  test('returns false when prefers-reduced-motion is not set', () => {
    (window.matchMedia as any).mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  test('returns true when prefers-reduced-motion is set to reduce', () => {
    (window.matchMedia as any).mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  test('updates when the media query changes', () => {
    let eventListener: (e: MediaQueryListEvent) => void;
    (window.matchMedia as any).mockReturnValue({
      matches: false,
      addEventListener: vi.fn((_event: string, callback: (e: MediaQueryListEvent) => void) => {
        eventListener = callback;
      }),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      eventListener({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });

  test('removes event listener on unmount', () => {
    const removeEventListener = vi.fn();
    (window.matchMedia as any).mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener,
    });

    const { unmount } = renderHook(() => usePrefersReducedMotion());
    unmount();

    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });
});
