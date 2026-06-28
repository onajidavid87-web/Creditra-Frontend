import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

const createLocalStorage = (): Storage => {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
    getItem: (key: string) => (key in store ? store[key] : null),
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
  };
};

const localStorage = createLocalStorage();

Object.defineProperty(window, "localStorage", {
  value: localStorage,
  configurable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: localStorage,
  configurable: true,
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserverMock,
  configurable: true,
});

beforeEach(() => {
  window.localStorage.clear();
  // Ensure ResizeObserver polyfill is in place per test
  Object.defineProperty(window, "ResizeObserver", {
    value: ResizeObserverMock,
    configurable: true,
  });
});

// JSDOM does not implement window.matchMedia — provide a stub that always
// reports non-mobile so components that branch on media queries work in tests.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
