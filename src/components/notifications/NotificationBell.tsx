import { useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationBell.css';

export function NotificationBell() {
  const { unreadCount, isPanelOpen, openPanel } = useNotifications();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hadPanelOpen = useRef(false);

  useEffect(() => {
    if (isPanelOpen) {
      hadPanelOpen.current = true;
      return;
    }

    if (hadPanelOpen.current) {
      buttonRef.current?.focus();
      hadPanelOpen.current = false;
    }
  }, [isPanelOpen]);

  return (
    <button
      ref={buttonRef}
      className="notif-bell"
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
