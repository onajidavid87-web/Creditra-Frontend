# Creditra Design System

The Creditra design system is the single source of truth for visual style,
interaction behaviour, and copy patterns across the lender/borrower
dashboard.

## What's in this folder

| File              | Purpose                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `tokens.md`       | Raw design tokens — color, spacing, typography, radii, shadows.         |
| `component.md`    | Specifications for reusable components built on top of the tokens.      |
| `interaction.md`  | Motion principles, focus / hover / active states, reduced-motion rules. |
| `alerts.md`       | Patterns for inline messages, toasts, and modal alerts.                 |
| `fig_file.md`     | Pointers to the canonical Figma file and node IDs.                      |

## How to use this

1. **Start in `tokens.md`** before reaching for raw CSS values. New
   components should be assembled from existing tokens rather than
   introducing one-off hex codes.
2. **Check `component.md`** for an existing pattern before building a new
   primitive — chances are something close already exists.
3. **Validate against `interaction.md`** for keyboard, focus, and motion
   behaviour, especially for anything modal-like.
4. **Cross-reference `alerts.md`** for severity, iconography, and copy
   tone when surfacing system state to the user.

For accessibility-specific guidance see `docs/accessibility.md` at the
repo root.
