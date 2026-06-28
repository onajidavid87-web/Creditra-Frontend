import React, { useEffect, useState } from 'react';
import { useOnline } from '../hooks/useOnline';
import './OfflineBanner.css';

export function OfflineBanner() {
  const { isOnline, checkOnlineStatus } = useOnline();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else if (show) {
      // Hide after a brief delay when connection is restored
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, show]);

  if (!show && isOnline) return null;

  return (
    <div
      className={`offline-banner ${isOnline ? 'offline-banner--restored' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="offline-banner__content">
        <span>
          {isOnline ? 'Connection restored.' : 'You are currently offline. Actions will be queued.'}
        </span>
        {!isOnline && (
          <button
            onClick={checkOnlineStatus}
            className="offline-banner__retry-button"
            aria-label="Retry connection"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
