import type { CSSProperties, ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface FormMessageProps {
  /** Optional stable id so callers can wire `aria-describedby`. */
  id?: string;
  /** Strong leading line; omit for message-only renders. */
  title?: ReactNode;
  /** Body text or rich node. Optional so `reserveSpace` can render an empty slot. */
  message?: ReactNode;
  /**
   * Visual treatment. `inline` is compact, used directly under inputs;
   * `alert` is the bigger boxed style used above modal forms.
   */
  tone?: "inline" | "alert";
  /**
   * Severity. Drives both the icon and the colour band. `error` is kept
   * as an alias of `danger` so callers from other parts of the app can
   * use the more conventional name.
   */
  type?: "success" | "danger" | "warning" | "info" | "error";
  /**
   * When true, the slot reserves vertical space (`min-height`) even
   * while empty. Used by forms that would otherwise jitter as the
   * message appears/disappears.
   */
  reserveSpace?: boolean;
  /** Override the default reserved height (52 px inline, 88 px alert). */
  minHeight?: number;
  /** Pass-through inline style for one-off layout tweaks. */
  style?: CSSProperties;
  /** Pass-through class name appended to the slot container. */
  className?: string;
}

/**
 * Tone-coded inline message for form fields and form-level alerts.
 *
 * The rendered element carries `role="alert"` and `aria-live="assertive"`
 * so screen readers announce the message as soon as it appears. This is
 * intentional — form errors are time-sensitive and shouldn't wait for the
 * user to navigate to them.
 *
 * Use `reserveSpace` on the canonical version below an input to prevent
 * layout shift when a message toggles on or off.
 */
export function FormMessage({
  id,
  title,
  message,
  tone = "inline",
  type = "danger",
  reserveSpace = false,
  minHeight,
  style,
  className = "",
}: FormMessageProps) {
  const hasContent = Boolean(title) || Boolean(message);

  if (!hasContent && !reserveSpace) {
    return null;
  }

  const slotClassName = [
    "form-message-slot",
    tone === "alert" ? "form-message-slot--alert" : "form-message-slot--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={slotClassName}
      style={{
        minHeight: reserveSpace
          ? minHeight ?? (tone === "alert" ? 88 : 52)
          : undefined,
        ...style,
      }}
    >
      {hasContent ? (
        <div
          id={id}
          role="alert"
          aria-live="assertive"
          className={`form-message form-message--${type === 'error' ? 'danger' : type} form-message--${tone}`}
        >
          {type === 'success' && <CheckCircle className="form-message__icon" aria-hidden="true" />}
          {(type === 'danger' || type === 'error') && <AlertCircle className="form-message__icon" aria-hidden="true" />}
          {type === 'warning' && <AlertTriangle className="form-message__icon" aria-hidden="true" />}
          {type === 'info' && <Info className="form-message__icon" aria-hidden="true" />}
          <div className="form-message__content">
            {title ? <strong className="form-message__title">{title}</strong> : null}
            {message ? <p className="form-message__text">{message}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
