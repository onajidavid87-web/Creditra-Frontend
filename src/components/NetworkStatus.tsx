import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnline } from '../hooks/useOnline';
import './NetworkStatus.css';

/**
 * Persistent header indicator for browser connectivity (navigator.onLine).
 *
 * Distinct from wallet Stellar network mismatch UI — this reflects whether the
 * device has an internet connection.
 *
 * Accessibility:
 * - Visible dot + icon + label (not color-only)
 * - `aria-label` on the indicator for the current state
 * - Screen-reader announcements on transitions via live region
 *   (assertive when offline, polite when restored)
 *
 * Styling: design tokens only (`--success`, `--error`, `--border`, etc.)
 */
export function NetworkStatus() {
  const { isOnline } = useOnline();
  const prevOnlineRef = useRef<boolean | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (prevOnlineRef.current === null) {
      prevOnlineRef.current = isOnline;
      return;
    }

    if (prevOnlineRef.current === isOnline) return;

    prevOnlineRef.current = isOnline;
    setAnnouncement(
      isOnline
        ? 'Network connection restored.'
        : 'Network connection lost. You are offline.',
    );
  }, [isOnline]);

  const statusLabel = isOnline ? 'Online' : 'Offline';
  const Icon = isOnline ? Wifi : WifiOff;

  return (
    <>
      <div
        className={`network-status network-status--${isOnline ? 'online' : 'offline'}`}
        aria-label={`Network status: ${statusLabel.toLowerCase()}`}
        title={`Network: ${statusLabel}`}
      >
        <Icon className="network-status__icon" size={16} strokeWidth={2} aria-hidden="true" />
        <span className="network-status__dot" aria-hidden="true" />
        <span className="network-status__label">{statusLabel}</span>
      </div>
      {announcement ? (
        <span
          className="sr-only"
          role={isOnline ? 'status' : 'alert'}
          aria-live={isOnline ? 'polite' : 'assertive'}
        >
          {announcement}
        </span>
      ) : null}
    </>
  );
}
