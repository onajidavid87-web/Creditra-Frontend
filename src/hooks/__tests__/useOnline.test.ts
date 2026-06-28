import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { useOnline } from '../useOnline';

describe('useOnline hook', () => {
  let originalOnLine: boolean;

  beforeAll(() => {
    originalOnLine = navigator.onLine;
  });

  afterAll(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true,
    });
  });

  const setNavigatorOnLine = (value: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      value,
      configurable: true,
    });
  };

  it('should initialize with navigator.onLine status', () => {
    setNavigatorOnLine(false);
    const { result } = renderHook(() => useOnline());
    expect(result.current.isOnline).toBe(false);
  });

  it('should update status on online/offline events', () => {
    setNavigatorOnLine(true);
    const { result } = renderHook(() => useOnline());
    expect(result.current.isOnline).toBe(true);

    act(() => {
      setNavigatorOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      setNavigatorOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
  });

  it('should execute action immediately if online', () => {
    setNavigatorOnLine(true);
    const { result } = renderHook(() => useOnline());
    const action = vi.fn();
    
    act(() => {
      result.current.queueAction(action);
    });
    
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should queue action and execute when coming online', () => {
    setNavigatorOnLine(false);
    const { result } = renderHook(() => useOnline());
    const action = vi.fn();
    
    act(() => {
      result.current.queueAction(action);
    });
    
    expect(action).not.toHaveBeenCalled();

    act(() => {
      setNavigatorOnLine(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should check status manually', () => {
    setNavigatorOnLine(false);
    const { result } = renderHook(() => useOnline());
    
    act(() => {
      setNavigatorOnLine(true);
      result.current.checkOnlineStatus();
    });
    
    expect(result.current.isOnline).toBe(true);
  });
});
