# PR Description: Add MICROCOPY guide and surface inline financial terms

## Summary
Resolves #242. This PR introduces a centralized guide for financial definitions and an interactive tooltip component to surface those definitions in-context, reducing jargon friction and improving overall user experience.

## What changed
- Created `docs/MICROCOPY.md` to centralize our standard financial definitions and UI copy guidelines (e.g., APR, Utilization, Credit Limit, Default, Dutch Auction).
- Added `InlineTermTooltip` component designed to wrap inline terminology with a dotted underline affordance.
- Integrated the tooltip with our existing CSS custom properties for dark mode and accessibility tokens.
- Added comprehensive unit tests and accessibility coverage (focus rings, `aria-describedby`, keyboard navigation) to ensure WCAG 2.1 AA compliance.

## Why
Users need easy access to clarify complex financial terminology without breaking their flow or leaving the page. Centralizing the definitions ensures consistency across the app, while the inline tooltip solves the immediate UX need securely and accessibly.

## Testing
- Ran `npm test` successfully (Vitest & React Testing Library).
- Verified keyboard accessibility (tab focus, visible focus ring).
- Checked styling across varied screen widths to confirm that tooltips don't overflow on smaller devices.
