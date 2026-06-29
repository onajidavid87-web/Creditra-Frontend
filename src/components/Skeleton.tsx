import React from 'react';
import './Skeleton.css';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Width passed through as a CSS dimension (string or px number). */
  width?: string | number;
  /** Height passed through as a CSS dimension (string or px number). */
  height?: string | number;
};

/**
 * Shimmer placeholder used during loading states.
 *
 * Dimensions are deliberately passed through as props so callers can
 * match the size of the eventual content exactly — preserving CLS while
 * a fetch is in flight.
 *
 * The shimmer animation is defined in `Skeleton.css` and is suppressed
 * under `@media (prefers-reduced-motion: reduce)`. See the loading-state
 * policy in `docs/ARCHITECTURE.md` section 5.
 *
 * @example
 *   <Skeleton width="100%" height={48} aria-label="Loading credit lines" />
 */
export const Skeleton: React.FC<SkeletonProps> = ({ width, height, style, className, ...rest }) => (
  <div
    className={`skeleton ${className ?? ''}`.trim()}
    style={{ width, height, ...style }}
    {...rest}
  />
);
