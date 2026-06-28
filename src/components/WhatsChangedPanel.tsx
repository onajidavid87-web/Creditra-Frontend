import { useState } from "react";
import { readJson, writeJson } from "../utils/storage";
import releaseData from "../data/releases.json";
import { useReducedMotion } from "../context/ReducedMotionContext";
import { COLOR } from "../utils/tokens";
import "./WhatsChangedPanel.css";

/**
 * A small panel that surfaces the last release's UX-impacting changes.
 * 
 * - Only renders when current release id differs from last seen.
 * - Dismiss writes `last_release_seen` to storage.
 * - Respects `prefers-reduced-motion` for slide-in animation.
 * - Accessible and tested for AA contrast.
 */
export function WhatsChangedPanel() {
  const { isReducedMotionActive } = useReducedMotion();
  const [dismissed, setDismissed] = useState(() => {
    const lastSeen = readJson<string>("last_release_seen", "");
    return lastSeen === releaseData.id;
  });

  if (dismissed || !releaseData || !releaseData.changes || releaseData.changes.length === 0) return null;

  const handleDismiss = () => {
    setDismissed(true);
    writeJson("last_release_seen", releaseData.id);
  };

  return (
    <div 
      className={`whats-changed-panel ${isReducedMotionActive ? "no-motion" : ""}`}
      style={{ borderColor: COLOR.accent }}
      role="region"
      aria-label="What's changed in this release"
    >
      <div className="whats-changed-header">
        <h3 style={{ color: COLOR.text }}>
          <span className="whats-changed-icon" aria-hidden="true">✨</span> What's new in {releaseData.id}
        </h3>
        <button 
          onClick={handleDismiss} 
          className="whats-changed-dismiss"
          aria-label="Dismiss changes panel"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <ul className="whats-changed-list">
        {releaseData.changes.map((change, i) => (
          <li key={i} style={{ color: COLOR.muted }}>{change}</li>
        ))}
      </ul>
    </div>
  );
}
