import type { ComponentPropsWithoutRef } from 'react';
import './EmptyStateIllustrations.css';

type IllustrationProps = ComponentPropsWithoutRef<'div'>;

/**
 * Shared empty-state illustrations for the main product surfaces.
 *
 * All SVG shapes intentionally use `currentColor` only so the artwork can
 * inherit the surrounding theme without maintaining a separate palette.
 * The illustrations are decorative; headings and body copy provide the
 * accessible name for each empty state.
 */
function IllustrationFrame({ className = '', children, ...props }: IllustrationProps) {
  const mergedClassName = ['empty-state-illustration', className].filter(Boolean).join(' ');

  return (
    <div className={mergedClassName} aria-hidden="true" {...props}>
      {children}
    </div>
  );
}

export function NoDataGraph(props: IllustrationProps) {
  return (
    <IllustrationFrame {...props}>
      <svg viewBox="0 0 180 140" fill="none" focusable="false">
        <rect x="18" y="18" width="144" height="104" rx="18" stroke="currentColor" strokeWidth="2" opacity="0.24" />
        <path d="M38 96H142" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.32" />
        <path d="M50 82L72 66L92 76L116 48L132 58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="82" r="4" fill="currentColor" />
        <circle cx="72" cy="66" r="4" fill="currentColor" />
        <circle cx="92" cy="76" r="4" fill="currentColor" opacity="0.72" />
        <circle cx="116" cy="48" r="4" fill="currentColor" />
        <circle cx="132" cy="58" r="4" fill="currentColor" opacity="0.72" />
        <path d="M54 108V92" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.38" />
        <path d="M78 108V86" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.52" />
        <path d="M102 108V94" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.28" />
        <path d="M126 108V74" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.68" />
      </svg>
    </IllustrationFrame>
  );
}

export function NoLines(props: IllustrationProps) {
  return (
    <IllustrationFrame {...props}>
      <svg viewBox="0 0 180 140" fill="none" focusable="false">
        <rect x="22" y="28" width="136" height="84" rx="16" stroke="currentColor" strokeWidth="2" opacity="0.24" />
        <rect x="36" y="42" width="108" height="56" rx="12" stroke="currentColor" strokeWidth="2" opacity="0.38" />
        <path d="M42 58H138" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.16" />
        <path d="M52 78H92" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.72" />
        <path d="M102 78H128" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.26" />
        <circle cx="132" cy="78" r="6" stroke="currentColor" strokeWidth="2" opacity="0.56" />
        <path d="M132 72V84" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.56" />
        <path d="M126 78H138" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.56" />
        <path d="M48 22L62 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
        <path d="M132 104L146 118" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
      </svg>
    </IllustrationFrame>
  );
}

export function NoActivity(props: IllustrationProps) {
  return (
    <IllustrationFrame {...props}>
      <svg viewBox="0 0 180 140" fill="none" focusable="false">
        <rect x="18" y="20" width="144" height="100" rx="18" stroke="currentColor" strokeWidth="2" opacity="0.24" />
        <path d="M46 48H110" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.16" />
        <path d="M46 68H134" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.18" />
        <path d="M46 88H96" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.16" />
        <circle cx="124" cy="48" r="18" stroke="currentColor" strokeWidth="2" opacity="0.72" />
        <path d="M124 38V48L131 55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M56 108C63 97 73 90 86 90C99 90 109 97 116 108" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <circle cx="86" cy="79" r="8" stroke="currentColor" strokeWidth="2" opacity="0.56" />
      </svg>
    </IllustrationFrame>
  );
}
