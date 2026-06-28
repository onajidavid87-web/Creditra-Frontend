import { render, screen, act, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationProvider } from '../../context/NotificationContext';
import { ToastContainer } from './ToastContainer';
import { useToast } from '../../hooks/useToast';

// Helper wrapper: mounts ToastContainer inside the provider and exposes
// the useToast hook so individual tests can fire toasts.
function TestHarness({
  onMount,
}: {
  onMount?: (toast: ReturnType<typeof useToast>) => void;
}) {
  const toast = useToast();
  if (onMount) onMount(toast);
  return <ToastContainer />;
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<NotificationProvider>{ui}</NotificationProvider>);
}

describe('ToastContainer', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

  // ─── Severity icons ────────────────────────────────────────────────────────

  it('renders an SVG severity icon for each toast', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);

    act(() => {
      toastFns.success('S', 'success');
      toastFns.error('E', 'error');
      toastFns.warning('W', 'warning');
      toastFns.info('I', 'info');
    });

    const icons = document.querySelectorAll('.toast-type-icon svg');
    expect(icons.length).toBe(4);
  });

  it('marks the icon badge as aria-hidden so AT uses the title instead', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => { toastFns.success('Done', 'Saved.'); });

    const badge = document.querySelector('.toast-type-icon');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
  });

  // ─── role="status" for non-urgent types ───────────────────────────────────

  it('gives success toasts role="status" and aria-live="polite"', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => { toastFns.success('Done', 'All good.'); });

    const toast = document.querySelector('.toast-item');
    expect(toast).toHaveAttribute('role', 'status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('gives info toasts role="status"', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => { toastFns.info('FYI', 'Note.'); });

    expect(document.querySelector('.toast-item')).toHaveAttribute('role', 'status');
  });

  it('gives warning toasts role="status"', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => { toastFns.warning('Caution', 'Low balance.'); });

    expect(document.querySelector('.toast-item')).toHaveAttribute('role', 'status');
  });

  // ─── role="alert" for urgent types ────────────────────────────────────────

  it('gives error toasts role="alert" and aria-live="assertive"', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => { toastFns.error('Failed', 'Could not connect.'); });

    const toast = document.querySelector('.toast-item');
    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  // ─── Theme colors ──────────────────────────────────────────────────────────

  it('applies the success theme color to the icon badge', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => { toastFns.success('OK', 'Saved.'); });

    const badge = document.querySelector('.toast-type-icon') as HTMLElement;
    // TYPE_COLOR.success.icon = '#3fb950'
    expect(badge.style.color).toMatch(/3fb950|rgb\(63,\s*185,\s*80\)/i);
  });

  it('applies the error theme color to the icon badge', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => { toastFns.error('Oops', 'Broke.'); });

    const badge = document.querySelector('.toast-type-icon') as HTMLElement;
    // TYPE_COLOR.error.icon = '#f85149'
    expect(badge.style.color).toMatch(/f85149|rgb\(248,\s*81,\s*73\)/i);
  });

  it('applies a left accent border colored by severity', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => { toastFns.error('Err', 'Bad.'); });

    const item = document.querySelector('.toast-item') as HTMLElement;
    // Should have a non-transparent left border (error color = #f85149)
    expect(item.style.borderLeft).toContain('4px solid');
  });

  // ─── Container role ────────────────────────────────────────────────────────

  it('wraps all toasts in a log region labelled "Notifications"', () => {
    renderWithProvider(<TestHarness />);
    const log = screen.getByRole('log', { name: /notifications/i });
    expect(log).toBeInTheDocument();
  });

  // ─── Dismiss ───────────────────────────────────────────────────────────────

  it('removes the toast after clicking dismiss', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => { toastFns.info('Hello', 'World.'); });

    expect(screen.getByText('Hello')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /dismiss notification/i }));
    act(() => { vi.advanceTimersByTime(400); });

    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  // ─── Edge cases ────────────────────────────────────────────────────────────

  it('caps the toast stack at 5 items', () => {
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => {
      for (let i = 0; i < 7; i++) {
        toastFns.info(`Toast ${i}`, 'msg');
      }
    });

    expect(document.querySelectorAll('.toast-item').length).toBeLessThanOrEqual(5);
  });

  it('renders an action button when an action is provided', () => {
    const onAction = vi.fn();
    let toastFns!: ReturnType<typeof useToast>;
    renderWithProvider(<TestHarness onMount={(t) => { toastFns = t; }} />);
    act(() => {
      toastFns.info('With action', 'Click below.', {
        action: { label: 'View details', onClick: onAction },
      });
    });

    expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
  });
});
