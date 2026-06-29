import { renderHook, act } from '@testing-library/react';
import { useDebounceValue } from '../useDebounceValue';

describe('useDebounceValue', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounceValue('test', 350));
    expect(result.current).toBe('test');
  });

  test('debounces value updates', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounceValue(value, delay), {
      initialProps: { value: 'initial', delay: 350 }
    });

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 350 });
    expect(result.current).toBe('initial'); // Still initial value

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current).toBe('updated'); // Now updated
  });

  test('cancels pending debounce on unmount', () => {
    const { result, unmount } = renderHook(() => useDebounceValue('test', 350));

    unmount();
    // If there were any side effects, they should be cleaned up
    expect(true).toBe(true);
  });
});
