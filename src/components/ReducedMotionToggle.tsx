import { useReducedMotion } from '../context/ReducedMotionContext';
import './HighContrastToggle.css'; // We can reuse the same CSS for the toggle row

interface ReducedMotionToggleProps {
  compact?: boolean;
}

export function ReducedMotionToggle({ compact = false }: ReducedMotionToggleProps) {
  const { motionOverride, toggleMotionOverride } = useReducedMotion();
  const isOn = motionOverride === 'reduced';

  return (
    <div className={`hc-toggle-row${compact ? ' hc-toggle-row--compact' : ''}`}>
      {!compact && (
        <div className="hc-toggle-label-group">
          <span className="hc-toggle-label" id="rm-toggle-label">
            Reduced Motion Preview
          </span>
          <span className="hc-toggle-description" id="rm-toggle-desc">
            Forces a reduced-motion state (like OS preferences) for testing. Persisted across sessions.
          </span>
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-labelledby={compact ? undefined : 'rm-toggle-label'}
        aria-label={compact ? 'Toggle reduced motion preview' : undefined}
        aria-describedby={compact ? undefined : 'rm-toggle-desc'}
        className="hc-toggle-btn"
        onClick={toggleMotionOverride}
        data-state={isOn ? 'on' : 'off'}
      >
        <span className="hc-toggle-track" aria-hidden="true">
          <span className="hc-toggle-thumb" />
        </span>
        <span className="sr-only">{isOn ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}
