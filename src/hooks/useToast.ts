import { useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';
import type { NotificationCategory } from '../types/notification';

interface ToastOptions {
  /** Category controls per-preference muting. Defaults to 'system'. */
  category?: NotificationCategory;
  /** Auto-dismiss delay in ms. Defaults to 5 500. */
  duration?: number;
  /** When true the toast stays until manually dismissed. */
  persistent?: boolean;
  /** Optional inline call-to-action rendered inside the toast. */
  action?: { label: string; onClick: () => void };
}

/**
 * Convenience wrapper around `useNotifications().addToast`.
 *
 * Usage:
 * ```ts
 * const toast = useToast();
 * toast.success('Repayment sent', 'Your payment is being processed.');
 * toast.error('Connection failed', 'Could not reach the Stellar network.');
 * ```
 *
 * Returns the toast id from each helper so callers can dismiss programmatically
 * via `toast.dismiss(id)` when needed.
 */
export function useToast() {
  const { addToast, dismissToast } = useNotifications();

  const success = useCallback(
    (title: string, message: string, opts?: ToastOptions) =>
      addToast({ type: 'success', title, message, ...opts }),
    [addToast],
  );

  const error = useCallback(
    (title: string, message: string, opts?: ToastOptions) =>
      addToast({ type: 'error', title, message, ...opts }),
    [addToast],
  );

  const warning = useCallback(
    (title: string, message: string, opts?: ToastOptions) =>
      addToast({ type: 'warning', title, message, ...opts }),
    [addToast],
  );

  const info = useCallback(
    (title: string, message: string, opts?: ToastOptions) =>
      addToast({ type: 'info', title, message, ...opts }),
    [addToast],
  );

  return {
    success,
    error,
    warning,
    info,
    dismiss: dismissToast,
  };
}
