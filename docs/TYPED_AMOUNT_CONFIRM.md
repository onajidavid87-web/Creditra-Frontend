# Typed amount confirmation

Reusable guard for **large repayment** flows. Requires the user to type the
exact dollar amount before confirming, reducing accidental high-value transactions.

## Components

| Export | Use |
| --- | --- |
| `TypedAmountConfirm` | Standalone modal with focus trap, scroll lock, and inert backdrop |
| `TypedAmountConfirmField` | Embedded field for review steps inside existing modals/pages |
| `parseTypedAmount` / `isTypedAmountMatch` | Pure helpers for match logic |
| `shouldRequireTypedAmountConfirm` | Thin wrapper over `requiresRepayConfirmation` |

## Threshold

Controlled by `VITE_REPAY_CONFIRM_THRESHOLD` (default **5000** USD). See
`src/utils/amountValidation.ts` and the root README environment section.

## Visible behaviour

**Modal (`TypedAmountConfirm`):**

- Shows repayment amount summary
- Requires typing the exact amount
- Confirm disabled until match; Cancel / Escape closes

**Embedded field (`TypedAmountConfirmField`):**

- Labelled currency input with `$` prefix
- Border turns error/success when typing
- Hint + status text wired via `aria-describedby`

## Integration

| Consumer | Pattern |
| --- | --- |
| `RepayModal` | `TypedAmountConfirmField` on review step when `requiresRepayConfirmation(amount)` |
| `QuickRepayModal` | Same embedded field |
| `RepayPage` | Same embedded field; confirm button disabled until match |

Standalone modal usage:

```tsx
<TypedAmountConfirm
  isOpen={showConfirm}
  amount={7500}
  onConfirm={submitRepayment}
  onCancel={() => setShowConfirm(false)}
  triggerRef={confirmButtonRef}
/>
```

## Accessibility

- Dialog: `role="dialog"`, `aria-modal="true"`, labelled heading
- Input: explicit `aria-label`, `aria-invalid` on mismatch
- Status hints use `role="status"` for live feedback
- 44px min touch targets; `:focus-visible` rings via design tokens
- Composes `useFocusTrap`, `useBodyScrollLock`, `useInertBackdrop`

## Tests

`src/components/TypedAmountConfirm.test.tsx` — helpers, field states, modal
interactions, Escape handling, confirm enablement.

```bash
npm test -- --run TypedAmountConfirm
```
