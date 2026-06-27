import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NotificationProvider, useNotifications } from '../../context/NotificationContext';
import {
  NotificationCenter,
  NOTIFICATION_CENTER_MD_BREAKPOINT,
  resolveSheetSnapFromRatio,
  SHEET_SNAP_RATIOS,
} from './NotificationCenter';

vi.mock('../../hooks/useBodyScrollLock', () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock('../../hooks/useInertBackdrop', () => ({
  useInertBackdrop: vi.fn(),
}));

function renderOpenPanel() {
  function Harness() {
    const { openPanel } = useNotifications();
    return (
      <>
        <button type="button" onClick={openPanel}>
          Open panel
        </button>
        <NotificationCenter />
      </>
    );
  }

  render(
    <NotificationProvider>
      <Harness />
    </NotificationProvider>,
  );
}

describe('resolveSheetSnapFromRatio', () => {
  it('dismisses when dragged below the lower threshold', () => {
    expect(resolveSheetSnapFromRatio(0.2)).toBe('dismiss');
  });

  it('snaps to half between 35% and 70% viewport height', () => {
    expect(resolveSheetSnapFromRatio(0.5)).toBe('half');
  });

  it('snaps to full at or above 70% viewport height', () => {
    expect(resolveSheetSnapFromRatio(0.85)).toBe('full');
  });
});

describe('NotificationCenter mobile bottom-sheet', () => {
  const mobileQuery = `(max-width: ${NOTIFICATION_CENTER_MD_BREAKPOINT - 1}px)`;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === mobileQuery,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('opens at the half snap point on mobile', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderOpenPanel();

    await user.click(screen.getByRole('button', { name: 'Open panel' }));

    const dialog = screen.getByRole('dialog', { name: 'Notification center' });
    expect(dialog).toHaveClass('nc-panel-snap-half');
    expect(dialog).not.toHaveClass('nc-panel-snap-full');
  });

  it('expands to the full snap point via keyboard-accessible control', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderOpenPanel();

    await user.click(screen.getByRole('button', { name: 'Open panel' }));
    await user.click(
      screen.getByRole('button', { name: 'Expand notification panel to full height' }),
    );

    const dialog = screen.getByRole('dialog', { name: 'Notification center' });
    expect(dialog).toHaveClass('nc-panel-snap-full');
  });

  it('collapses back to the half snap point', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderOpenPanel();

    await user.click(screen.getByRole('button', { name: 'Open panel' }));
    await user.click(
      screen.getByRole('button', { name: 'Expand notification panel to full height' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Collapse notification panel to half height' }),
    );

    const dialog = screen.getByRole('dialog', { name: 'Notification center' });
    expect(dialog).toHaveClass('nc-panel-snap-half');
  });

  it('exposes expand and collapse controls only in the mobile sheet chrome', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderOpenPanel();

    await user.click(screen.getByRole('button', { name: 'Open panel' }));

    expect(
      screen.getByRole('button', { name: 'Expand notification panel to full height' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Collapse notification panel to half height' }),
    ).toBeInTheDocument();
  });

  it('maps snap points to 50% and 90% viewport height ratios', () => {
    expect(SHEET_SNAP_RATIOS.half).toBe(0.5);
    expect(SHEET_SNAP_RATIOS.full).toBe(0.9);
  });
});

describe('NotificationCenter focus trap', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('focuses the first control when the panel opens', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderOpenPanel();

    await user.click(screen.getByRole('button', { name: 'Open panel' }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Notification preferences' }),
    );
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderOpenPanel();

    await user.click(screen.getByRole('button', { name: 'Open panel' }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    await user.keyboard('{Escape}');

    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });
});
