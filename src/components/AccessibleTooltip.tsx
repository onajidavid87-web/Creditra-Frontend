import { useId, type ReactNode } from 'react';
import './AccessibleTooltip.css';

interface AccessibleTooltipProps {
  /** Plain-text label surfaced visually and to assistive tech via `aria-describedby`. */
  label: string;
  /** Optional inline content to render as the interactive glossary trigger. */
  children?: ReactNode;
}

/**
 * Compact keyboard-focusable info trigger.
 *
 * Renders a small "i" affordance that surfaces `label` as a tooltip on
 * hover and keyboard focus. The trigger is `tabIndex={0}` (focusable
 * without being a button so it can sit inline next to labels), carries
 * `aria-label="More information"`, and is wired to the tooltip via
 * `aria-describedby` — so screen readers announce the label as the
 * trigger's accessible description.
 *
 * The visible tooltip itself uses `role="tooltip"`, and its show/hide
 * behaviour is controlled by `:hover` / `:focus-within` in
 * `AccessibleTooltip.css` — there's no JS state.
 */
export function AccessibleTooltip({ label, children }: AccessibleTooltipProps) {
  const tooltipId = useId();
  const hasInlineContent = Boolean(children);

  return (
    <span className={`accessible-tooltip${hasInlineContent ? ' accessible-tooltip--inline' : ''}`}>
      <span
        tabIndex={0}
        className={`accessible-tooltip__trigger${hasInlineContent ? ' accessible-tooltip__trigger--text' : ''}`}
        aria-label="More information"
        aria-describedby={tooltipId}
      >
        {hasInlineContent ? (
          <span className="accessible-tooltip__label">{children}</span>
        ) : (
          <span aria-hidden="true">i</span>
        )}
      </span>
      <span id={tooltipId} role="tooltip" className="accessible-tooltip__content">
        {label}
      </span>
    </span>
  );
}
