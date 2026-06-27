/**
 * ContrastContext tests
 *
 * Cover:
 *  1. Default mode is 'normal', no data-contrast attribute applied.
 *  2. toggleContrast switches to 'high' and applies [data-contrast="high"].
 *  3. Toggling again returns to 'normal' and removes the attribute.
 *  4. setContrastMode('high') / ('normal') works directly.
 *  5. Mode is persisted to localStorage via writeJson.
 *  6. Mode is read from localStorage on mount (readJson).
 *  7. useContrast throws when used outside a provider.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContrastProvider, useContrast } from './ContrastContext';

// ── Test helper component ────────────────────────────────────────────────────

function TestConsumer() {
  const { contrastMode, toggleContrast, setContrastMode } = useContrast();
  return (
    <div>
      <span data-testid="mode">{contrastMode}</span>
      <button onClick={toggleContrast}>toggle</button>
      <button onClick={() => setContrastMode('high')}>set-high</button>
      <button onClick={() => setContrastMode('normal')}>set-normal</button>
    </div>
  );
}

function renderWithProvider(preloadedStorage?: Record<string, string>) {
  if (preloadedStorage) {
    for (const [k, v] of Object.entries(preloadedStorage)) {
      window.localStorage.setItem(k, v);
    }
  }
  return render(
    <ContrastProvider>
      <TestConsumer />
    </ContrastProvider>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ContrastContext', () => {
  beforeEach(() => {
    // Remove the attribute set by a previous test.
    document.documentElement.removeAttribute('data-contrast');
  });

  it('defaults to normal mode with no stored value', () => {
    renderWithProvider();
    expect(screen.getByTestId('mode').textContent).toBe('normal');
    expect(document.documentElement.getAttribute('data-contrast')).toBeNull();
  });

  it('applies [data-contrast="high"] after toggling on', async () => {
    renderWithProvider();
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('mode').textContent).toBe('high');
    expect(document.documentElement.getAttribute('data-contrast')).toBe('high');
  });

  it('removes [data-contrast] attribute when toggling back to normal', async () => {
    renderWithProvider();
    const btn = screen.getByRole('button', { name: 'toggle' });
    await userEvent.click(btn); // → high
    await userEvent.click(btn); // → normal
    expect(screen.getByTestId('mode').textContent).toBe('normal');
    expect(document.documentElement.getAttribute('data-contrast')).toBeNull();
  });

  it('setContrastMode("high") applies attribute and updates state', async () => {
    renderWithProvider();
    await userEvent.click(screen.getByRole('button', { name: 'set-high' }));
    expect(screen.getByTestId('mode').textContent).toBe('high');
    expect(document.documentElement.getAttribute('data-contrast')).toBe('high');
  });

  it('setContrastMode("normal") removes attribute', async () => {
    // Start in high mode
    renderWithProvider({ 'creditra-contrast': '"high"' });
    await userEvent.click(screen.getByRole('button', { name: 'set-normal' }));
    expect(screen.getByTestId('mode').textContent).toBe('normal');
    expect(document.documentElement.getAttribute('data-contrast')).toBeNull();
  });

  it('persists mode to localStorage when toggled', async () => {
    renderWithProvider();
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    const stored = window.localStorage.getItem('creditra-contrast');
    expect(stored).toBe('"high"');
  });

  it('reads persisted high mode from localStorage on mount', () => {
    renderWithProvider({ 'creditra-contrast': '"high"' });
    expect(screen.getByTestId('mode').textContent).toBe('high');
    expect(document.documentElement.getAttribute('data-contrast')).toBe('high');
  });

  it('falls back to normal when stored value is invalid', () => {
    renderWithProvider({ 'creditra-contrast': 'not-valid-json{' });
    expect(screen.getByTestId('mode').textContent).toBe('normal');
  });

  it('throws when useContrast is used outside a provider', () => {
    // Suppress React's error console noise in this intentional throw test.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Naked() {
      useContrast();
      return null;
    }
    expect(() => render(<Naked />)).toThrow(
      'useContrast must be used within a ContrastProvider',
    );
    spy.mockRestore();
  });
});
