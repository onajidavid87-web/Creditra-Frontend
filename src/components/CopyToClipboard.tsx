import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard';
import './CopyToClipboard.css';

export const COPY_FEEDBACK_DURATION_MS = 2000;

interface CopyToClipboardProps {
  /** The raw string written to the clipboard on click. */
  value: string;
  /**
   * Optional override for the visible value. Defaults to `value`. Use
   * this when the displayed form is a truncated address but the copied
   * form should be the full string.
   */
  displayValue?: ReactNode;
  /**
   * Required descriptive `aria-label` for the copy button, e.g.
   * `Copy connected wallet address` or
   * `Copy transaction hash for TX-001`. Must be specific so the user
   * knows which value is being copied when several `CopyToClipboard`
   * instances live on the same screen.
   */
  ariaLabel: string;
  /** Label shown in the idle state. Defaults to `Copy`. */
  copyLabel?: string;
  /** Label shown for `COPY_FEEDBACK_DURATION_MS` after success. Defaults to `Copied`. */
  copiedLabel?: string;
  /**
   * Visual treatment: `inline` flows with surrounding text; `surface`
   * styles the value as a chip on a contrasting background.
   */
  variant?: 'inline' | 'surface';
  /** Class name appended to the root container. */
  className?: string;
  /** Class name applied to the displayed value element. */
  valueClassName?: string;
  /** Class name applied to the copy button. */
  buttonClassName?: string;
  /**
   * When true, the click handler calls `event.stopPropagation()`. Use
   * inside a clickable parent (e.g. a list row that navigates) so the
   * copy click doesn't also trigger row navigation.
   */
  stopPropagation?: boolean;
}

/**
 * Standardised "copy to clipboard" affordance for wallet addresses and
 * transaction hashes.
 *
 * The button flips its label from `Copy` to `Copied` for
 * `COPY_FEEDBACK_DURATION_MS` (2000 ms) on success, then returns to the
 * idle state. The label change is announced to screen readers via a
 * polite live region so AT users get the same feedback as sighted users.
 *
 * Always renders a real `<button>` (not a `<div role="button">`) so
 * keyboard activation, focus styling, and disabled states are inherited
 * for free.
 *
 * See `docs/ACCESSIBILITY.md` section 5 for the canonical contract.
 */
export function CopyToClipboard({
  value,
  displayValue,
  ariaLabel,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  variant = 'inline',
  className = '',
  valueClassName = '',
  buttonClassName = '',
  stopPropagation = false,
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }

    await copyTextToClipboard(value);

    setCopied(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, COPY_FEEDBACK_DURATION_MS);
  };

  const containerClassName = [
    'copy-affordance',
    variant === 'surface' ? 'copy-affordance--surface' : '',
    className,
  ].filter(Boolean).join(' ');

  const resolvedValueClassName = ['copy-affordance__value', valueClassName].filter(Boolean).join(' ');
  const resolvedButtonClassName = ['copy-affordance__button', buttonClassName].filter(Boolean).join(' ');
  const announcement = copied ? `${copiedLabel}: ${ariaLabel}` : '';

  return (
    <div className={containerClassName}>
      {displayValue ? <span className={resolvedValueClassName}>{displayValue}</span> : null}
      <button
        type="button"
        className={resolvedButtonClassName}
        aria-label={ariaLabel}
        data-copied={copied}
        onClick={handleCopy}
      >
        <span className="copy-affordance__button-label">{copied ? copiedLabel : copyLabel}</span>
        {copied ? (
          <Check className="copy-affordance__icon" aria-hidden="true" />
        ) : (
          <Copy className="copy-affordance__icon" aria-hidden="true" />
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
