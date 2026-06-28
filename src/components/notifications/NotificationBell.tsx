/**
 * NotificationBell
 *
 * Displays an icon button with an unread-count badge.
 * Plays a one-shot 600 ms pulse ring ONLY when a NEW high-priority
 * notification arrives (risk drop, default warning, etc.).
 *
 * Accessibility:
 *  - A polite ARIA live region is the canonical signal for screen readers.
 *  - The pulse is purely visual; it does NOT replace the live region.
 *  - Reduced-motion: pulse → brief border flash (via CSS media query).
 *  - Button has a visible :focus-visible ring inherited from global styles.
 *
 * Issue: #219
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import './NotificationBell.css';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  message: string;
  /** When true this notification triggers the pulse animation. */
  highPriority?: boolean;
}

export interface NotificationBellProps {
  notifications: Notification[];
  onClick?: () => void;
  /** Accessible label for the button (defaults to "Notifications"). */
  label?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function NotificationBell({
  notifications,
  onClick,
  label = 'Notifications',
}: NotificationBellProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  /**
   * Track the ID of the last high-priority notification we pulsed for.
   * Ensures we pulse once per ARRIVAL, not on every render or count change.
   */
  const lastPulsedIdRef = useRef<string | null>(null);

  const unreadCount = notifications.length;

  // ── Pulse trigger ──────────────────────────────────────────────────────────

  useEffect(() => {
    // Find the most recent high-priority notification
    const latest = notifications
      .filter((n) => n.highPriority)
      .at(-1); // last in array = newest arrival

    if (!latest) return;
    if (latest.id === lastPulsedIdRef.current) return; // already pulsed for this one

    // New high-priority arrival — trigger pulse
    lastPulsedIdRef.current = latest.id;
    setIsPulsing(true);
    setLiveMessage(`High-priority notification: ${latest.message}`);

    // Remove the class after the animation completes so it can re-trigger
    // if another high-priority item arrives later.
    const timer = setTimeout(() => setIsPulsing(false), 650); // 600 ms + 50 ms buffer
    return () => clearTimeout(timer);
  }, [notifications]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Button ── */}
      <button
        type="button"
        onClick={onClick}
        aria-label={
          unreadCount > 0
            ? `${label} — ${unreadCount} unread`
            : label
        }
        className={[
          'relative inline-flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'text-gray-600 hover:text-gray-900',
          'hover:bg-gray-100 transition-colors duration-150',
          'focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
          isPulsing ? 'bell-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Bell size={20} aria-hidden="true" />

        {/* ── Unread badge ── */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true" /* count is already in the button aria-label */
            className={[
              'absolute -top-0.5 -right-0.5',
              'min-w-[18px] h-[18px] px-1',
              'flex items-center justify-center',
              'rounded-full text-[10px] font-semibold leading-none',
              'bg-yellow-400 text-yellow-900', /* AA contrast: 5.2:1 */
            ].join(' ')}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Polite live region (canonical a11y signal) ── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        /**
         * Visually hidden but readable by screen readers.
         * Do NOT use display:none or visibility:hidden — those hide from AT too.
         */
        className="sr-only"
      >
        {liveMessage}
      </div>
    </>
  );
}

export default NotificationBell;
