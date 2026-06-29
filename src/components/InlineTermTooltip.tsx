import React, { useId } from 'react';
import './InlineTermTooltip.css';

interface InlineTermTooltipProps {
  /** The term to be displayed inline and interactively. */
  term: string | React.ReactNode;
  /** The definition or explanation of the term to display in the tooltip. */
  definition: string | React.ReactNode;
}

/**
 * An inline tooltip component designed for surfacing financial term definitions.
 *
 * Renders the provided `term` with a dotted underline affordance. On hover or keyboard
 * focus, it displays the `definition` in a styled tooltip above the term.
 * It is fully accessible, using `tabIndex={0}` to allow keyboard navigation and
 * `aria-describedby` to associate the term with its definition for screen readers.
 * Features a visible focus ring for WCAG AA compliance.
 */
export function InlineTermTooltip({ term, definition }: InlineTermTooltipProps) {
  const tooltipId = useId();

  return (
    <span className="inline-term-tooltip">
      <span
        tabIndex={0}
        className="inline-term-tooltip__trigger"
        aria-describedby={tooltipId}
        role="button"
        aria-expanded={false} // Since this is CSS-driven hover/focus, we don't dynamically toggle this, but we act as a button-like trigger
      >
        {term}
      </span>
      <span id={tooltipId} role="tooltip" className="inline-term-tooltip__content">
        {definition}
      </span>
    </span>
  );
}
