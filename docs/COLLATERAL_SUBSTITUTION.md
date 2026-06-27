# Collateral Substitution Flow

**Campaign:** GrantFox  
**Feature:** Swap one pledged collateral asset for another with side-by-side LTV comparison and fee surfacing.

---

## Overview

The collateral substitution flow lets a borrower replace the asset currently securing a credit line with a different one. Before committing, the user sees a side-by-side comparison of the outgoing and incoming assets — including the resulting LTV ratio, headroom, and the total processing fee — and must type the incoming asset's name to unlock the irreversible confirmation.

---

## Files

| File | Purpose |
|---|---|
| `src/types/collateral.ts` | Domain types: `CollateralAsset`, `LtvSnapshot`, `SubstitutionFee`, `SubstitutionStep`, `SubstitutionStatus` |
| `src/utils/collateral.ts` | Pure helpers: LTV math, fee calculation, asset catalogue, name-matching |
| `src/utils/collateral.test.ts` | 28 unit tests for all utility functions |
| `src/components/CollateralSubstitutionModal.tsx` | Three-step modal component |
| `src/components/CollateralSubstitutionModal.css` | Component-scoped styles using CSS custom properties |
| `src/components/__tests__/CollateralSubstitutionModal.test.tsx` | 27 component integration tests |
| `src/pages/CreditLines.tsx` | Wired the "⇄ Swap Collateral" button on active credit lines |

---

## User Flow

```
Credit Lines page
  └─ [Active line] → ⇄ Swap Collateral button
       │
       ▼
Step 1 — Select
  • Lists all available collateral assets except the currently pledged one
  • Shows each asset's value, current effective LTV, and max LTV
  • "Review" is disabled until an asset is selected

       │  user selects an asset
       ▼
Step 2 — Review (side-by-side comparison)
  • LEFT card   — current asset: value, LTV, max LTV, headroom, progress bar
  • RIGHT card  — incoming asset: same metrics
  • Arrow column — LTV delta pill (e.g. "−8.4 pp" in green / "+5.2 pp" in red)
  • Fee breakdown: processing fee (0.5% of balance) + appraisal fee ($250 for real estate)
  • Over-LTV warning banner if the incoming asset can't cover the loan
  • "Continue" is disabled when the incoming asset is over-LTV

       │  user clicks Continue
       ▼
Step 3 — Confirm (irreversible-action gate)
  • Summary recap: replacing / new collateral / new LTV / total fee
  • User must type the exact incoming asset name (case-insensitive) to unlock submit
  • "Confirm substitution" button uses PendingButton with aria-busy during network call

       │  successful submission
       ▼
Success state
  • Animated check icon
  • Confirmation copy with asset name
  • "Done" button calls onClose
```

---

## Architecture

### Component props

```ts
interface CollateralSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (incomingAsset: CollateralAsset) => void;
  creditLineName: string;
  loanBalance: number;              // outstanding balance in USD
  currentAsset?: CollateralAsset;  // undefined → no current collateral
  triggerRef?: React.RefObject<HTMLElement | null>;
  _delayMs?: number;               // internal: override network delay for tests
}
```

### LTV calculation

```
ltvRatio         = loanBalance / asset.value
isOverLtv        = ltvRatio > asset.maxLtvRatio
availableHeadroom = asset.value × asset.maxLtvRatio − loanBalance
```

### Fee schedule

| Asset category | Processing fee | Appraisal fee |
|---|---|---|
| crypto, receivables, treasury, other | 0.5% of balance | — |
| real_estate | 0.5% of balance | $250 flat |

---

## State machine

```
idle → [user clicks Submit] → pending → success
                                      ↘ error  (submission fails; user can retry)
```

All step/status state lives inside `CollateralSubstitutionModal`. The parent (`CreditLines`) only sees `onClose` and `onSuccess(incomingAsset)`.

---

## Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="csm-title"`, `aria-describedby="csm-subtitle"`
- Three hooks: `useFocusTrap` + `useBodyScrollLock` + `useInertBackdrop` (same pattern as `WalletConnectionModal`)
- Escape key closes the modal via both the focus-trap hook and a direct `onKeyDown` on the dialog element
- Asset list uses `role="listbox"` / `role="option"` / `aria-selected`
- LTV progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`
- LTV delta announced to screen readers via an `aria-live="polite"` `sr-only` paragraph
- Over-LTV warning uses `role="alert"`
- Submission error uses `role="alert"`
- All color-coded states (improvement/degradation/over-LTV) use color + numeric value + descriptive text — WCAG 1.4.1 compliant
- Minimum 44×44 px tap targets on all interactive elements — WCAG 2.5.5
- `prefers-reduced-motion`: animations suppressed

---

## Connecting to a real API

`handleSubmit` in `CollateralSubstitutionModal.tsx` contains a `TODO` comment showing where to replace the simulated delay with a real call:

```ts
// Replace this Promise with your API call:
await apiClient.substituteCollateral({
  creditLineId,
  outgoingAssetId: currentAsset?.id,
  incomingAssetId: selected.id,
});
```

Pass the asset catalogue from your API via the `AVAILABLE_COLLATERAL_ASSETS` export in `src/utils/collateral.ts` (replace the static array with a fetched list).

---

## Tests

```bash
# utility functions only (fast, no DOM)
npx vitest run src/utils/collateral.test.ts

# component tests (jsdom)
npx vitest run src/components/__tests__/CollateralSubstitutionModal.test.tsx

# both
npx vitest run src/utils/collateral.test.ts src/components/__tests__/CollateralSubstitutionModal.test.tsx
```

**55 tests, 0 failures.**

### Test strategy notes

- The three accessibility hooks (`useFocusTrap`, `useBodyScrollLock`, `useInertBackdrop`) are mocked in the component test file because jsdom does not implement `window.scrollTo` or the `inert` attribute. This is the same pattern used by other modal tests in the project.
- Dismiss/close tests use `fireEvent` instead of `userEvent` to avoid the pointer-event pipeline delays in jsdom.
- Submission tests use `_delayMs={0}` to make the simulated network Promise resolve immediately, avoiding fake timer complexity.
