/**
 * NotificationBell — header trigger button for the notification center.
 *
 * Exposes its internal button ref via React.forwardRef so the parent
 * NotificationWidget can pass it to NotificationCenter as `triggerRef`,
 * enabling correct return-focus when the panel closes.
 */
import { forwardRef, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationBell.css';

export const NotificationBell = forwardRef<HTMLButtonElement>(
  function NotificationBell(_props, ref) {
    const { unreadCount, isPanelOpen, openPanel } = useNotifications();

    // Internal fallback ref used only for the return-focus side-effect below.
    // When a forwarded ref is provided the parent manages focus return instead.
    const internalRef = useRef<HTMLButtonElement>(null);
    const buttonRef   = (ref ?? internalRef) as React.RefObject<HTMLButtonElement>;
    const hadPanelOpen = useRef(false);

    useEffect(() => {
      if (isPanelOpen) {
        hadPanelOpen.current = true;
        return;
      }
      // When no triggerRef is forwarded to NotificationCenter, fall back to
      // returning focus here (original behaviour).
      if (hadPanelOpen.current && !ref) {
        buttonRef.current?.focus();
        hadPanelOpen.current = false;
      }
    }, [isPanelOpen, ref, buttonRef]);

    return (
      <button
        ref={buttonRef}
        className="notif-bell"
        type="button"
        onClick={openPanel}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
        aria-controls="notification-center"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notif-bell-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }
);
