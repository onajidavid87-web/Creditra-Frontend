/**
 * NotificationBell tests — Issue #219
 *
 * Covers:
 *  1. Renders without notifications
 *  2. Shows correct unread count
 *  3. Pulse fires once on high-priority arrival
 *  4. Pulse does NOT fire for normal-priority arrivals
 *  5. Pulse does NOT re-fire when count changes but no new arrival
 *  6. Polite live region is updated on high-priority arrival
 *  7. Live region is NOT updated for normal arrivals
 *  8. onClick handler is called
 *  9. Badge caps at 99+
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationBell, Notification } from './NotificationBell';

// ── Helpers ──────────────────────────────────────────────────────────────────

const normal = (id: string, message = 'Info'): Notification => ({
  id,
  message,
  highPriority: false,
});

const high = (id: string, message = 'Risk drop detected'): Notification => ({
  id,
  message,
  highPriority: true,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NotificationBell', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // 1
  it('renders the bell button with no badge when notifications is empty', () => {
    render(<NotificationBell notifications={[]} />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByText(/\d/)).toBeNull();
  });

  // 2
  it('shows the correct unread count in the badge', () => {
    render(<NotificationBell notifications={[normal('a'), normal('b')]} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // 3
  it('applies bell-pulse class when a new high-priority notification arrives', () => {
    const { rerender } = render(<NotificationBell notifications={[]} />);
    const btn = screen.getByRole('button');
    expect(btn).not.toHaveClass('bell-pulse');

    rerender(<NotificationBell notifications={[high('hp-1')]} />);
    expect(btn).toHaveClass('bell-pulse');
  });

  // 4
  it('does NOT pulse for normal-priority arrivals', () => {
    const { rerender } = render(<NotificationBell notifications={[]} />);
    rerender(<NotificationBell notifications={[normal('n-1')]} />);
    expect(screen.getByRole('button')).not.toHaveClass('bell-pulse');
  });

  // 5
  it('removes bell-pulse class after 650 ms (one-shot)', async () => {
    const { rerender } = render(<NotificationBell notifications={[]} />);
    rerender(<NotificationBell notifications={[high('hp-1')]} />);

    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('bell-pulse');

    await act(async () => vi.advanceTimersByTime(700));
    expect(btn).not.toHaveClass('bell-pulse');
  });

  // 5b
  it('does NOT re-pulse when count changes without a new high-priority arrival', async () => {
    const { rerender } = render(
      <NotificationBell notifications={[high('hp-1')]} />
    );
    // Let the first pulse expire
    await act(async () => vi.advanceTimersByTime(700));

    const btn = screen.getByRole('button');
    expect(btn).not.toHaveClass('bell-pulse');

    // Add another NORMAL notification — same high-priority id, just more items
    rerender(
      <NotificationBell notifications={[high('hp-1'), normal('n-2')]} />
    );
    expect(btn).not.toHaveClass('bell-pulse');
  });

  // 5c
  it('pulses again when a SECOND distinct high-priority notification arrives', async () => {
    const { rerender } = render(
      <NotificationBell notifications={[high('hp-1')]} />
    );
    await act(async () => vi.advanceTimersByTime(700));

    rerender(
      <NotificationBell notifications={[high('hp-1'), high('hp-2', 'Default warning')]} />
    );
    expect(screen.getByRole('button')).toHaveClass('bell-pulse');
  });

  // 6
  it('updates polite live region with high-priority message', () => {
    render(<NotificationBell notifications={[high('hp-1', 'Risk drop detected')]} />);
    expect(
      screen.getByRole('status')
    ).toHaveTextContent('High-priority notification: Risk drop detected');
  });

  // 7
  it('does NOT update live region for normal-priority arrivals', () => {
    const { rerender } = render(<NotificationBell notifications={[]} />);
    rerender(<NotificationBell notifications={[normal('n-1', 'You have mail')]} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  // 8
  it('calls onClick when the button is pressed', async () => {
    const onClick = vi.fn();
    render(<NotificationBell notifications={[]} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // 9
  it('caps badge at 99+ when count exceeds 99', () => {
    const many = Array.from({ length: 100 }, (_, i) => normal(String(i)));
    render(<NotificationBell notifications={many} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  // 10
  it('uses custom label in aria-label', () => {
    render(
      <NotificationBell
        notifications={[normal('a')]}
        label="Alerts"
      />
    );
    expect(
      screen.getByRole('button', { name: /Alerts — 1 unread/i })
    ).toBeInTheDocument();
  });
});
