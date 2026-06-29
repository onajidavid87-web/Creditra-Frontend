/**
 * SessionTimeoutBanner
 *
 * Shows a dismissible warning banner when the wallet session is within
 * SESSION_WARN_BEFORE_MS (60 s) of silent disconnection.
 *
 * Accessibility
 * ─────────────────────────────────────────────────────────────────────────────
 * - The banner itself uses `role="alert"` / `aria-live="assertive"` so it is
 *   announced immediately when it appears.
 * - A separate `role="status"` / `aria-live="polite"` live region announces the
 *   countdown every 10 s so screen-reader users have a sense of urgency without
 *   being interrupted on every second.
 * - "Stay connected" and "Dismiss" buttons meet the 44×44 px touch target.
 * - All colours reference CSS custom properties so the component adapts to
 *   `[data-contrast="high"]` automatically.
 * - `prefers-reduced-motion`: the fade-in animation is suppressed via CSS.
 *
 * Visibility
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders only when `sessionTimeoutWarning === true` (set by WalletContext
 * 60 s before the session expires). Disappears when:
 *   1. `stayConnected()` succeeds (WalletContext resets the flag).
 *   2. The user dismisses it manually.
 *   3. The session expires and `status` becomes `'disconnected'`.
 *
 * Mount once just below the header, inside both WalletProvider and
 * NotificationProvider:
 *
 * ```tsx
 * <WalletProvider>
 *   <NotificationProvider>
 *     <SessionTimeoutBanner />
 *     …
 *   </NotificationProvider>
 * </WalletProvider>
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { SESSION_WARN_BEFORE_MS } from '../context/WalletContext';
import './SessionTimeoutBanner.css';

// Announce countdown via polite live region every N seconds.
const ANNOUNCE_INTERVAL_MS = 10_000;

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionTimeoutBanner() {
  const { sessionTimeoutWarning, stayConnected, status } = useWallet();

  // Local dismissed flag so the user can hide the banner within the same
  // warning window without resetting the underlying timer.
  const [dismissed, setDismissed] = useState(false);

  // Seconds remaining, derived from SESSION_WARN_BEFORE_MS and decremented
  // each second while the banner is visible.
  const [secondsLeft, setSecondsLeft] = useState(
    Math.floor(SESSION_WARN_BEFORE_MS / 1_000),
  );

  // Tracks what we last announced so we don't repeat the same value.
  const lastAnnouncedRef = useRef<number | null>(null);
  const [announced, setAnnounced] = useState('');

  // Reset dismissed + countdown whenever a new warning window opens.
  useEffect(() => {
    if (sessionTimeoutWarning) {
      setDismissed(false);
      setSecondsLeft(Math.floor(SESSION_WARN_BEFORE_MS / 1_000));
      lastAnnouncedRef.current = null;
    }
  }, [sessionTimeoutWarning]);

  // Decrement countdown while banner is visible.
  useEffect(() => {
    if (!sessionTimeoutWarning || dismissed) return;

    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1_000);

    return () => clearInterval(id);
  }, [sessionTimeoutWarning, dismissed]);

  // Update polite announcement every ANNOUNCE_INTERVAL_MS seconds.
  useEffect(() => {
    if (!sessionTimeoutWarning || dismissed) return;
    if (secondsLeft <= 0) return;

    const bucket = Math.ceil(secondsLeft / (ANNOUNCE_INTERVAL_MS / 1_000));
    if (bucket !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = bucket;
      setAnnounced(`Wallet disconnects in ${secondsLeft} seconds.`);
    }
  }, [secondsLeft, sessionTimeoutWarning, dismissed]);

  const handleStayConnected = useCallback(async () => {
    await stayConnected();
    // stayConnected resets sessionTimeoutWarning in WalletContext on success,
    // which will cause this component to stop rendering naturally.
  }, [stayConnected]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Hide when: warning not active, user dismissed, or session already expired.
  if (!sessionTimeoutWarning || dismissed || status === 'disconnected') return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const countdownLabel =
    mins > 0
      ? `${mins}m ${secs.toString().padStart(2, '0')}s`
      : `${secondsLeft}s`;

  return (
    <>
      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <div
        className="session-timeout-banner"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="session-timeout-banner"
      >
        {/* Warning icon — decorative */}
        <span className="stb-icon" aria-hidden="true">⚠</span>

        <span className="stb-message">
          Your wallet session expires in{' '}
          <strong data-testid="stb-countdown">{countdownLabel}</strong>
          .
        </span>

        <button
          type="button"
          className="stb-btn stb-btn--stay focus-ring"
          onClick={handleStayConnected}
          aria-label="Stay connected — re-verify wallet liveness"
          data-testid="stb-stay-btn"
        >
          Stay connected
        </button>

        <button
          type="button"
          className="stb-btn stb-btn--dismiss focus-ring"
          onClick={handleDismiss}
          aria-label="Dismiss session timeout warning"
          data-testid="stb-dismiss-btn"
        >
          ✕
        </button>
      </div>

      {/*
        ── Polite live region ────────────────────────────────────────────
        Separate from the assertive alert so screen readers aren't
        interrupted on every second tick. Announces every ~10 s.
        Visually hidden but present in the accessibility tree.
      */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="stb-live-region"
        data-testid="stb-live-region"
      >
        {announced}
      </div>
    </>
  );
}
