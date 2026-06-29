# Requirements Document

## Introduction

**Feature:** Default-Risk Education Modal  
**Campaign:** GrantFox  
**Type:** UI/UX feature — first-time borrower gate

First-time borrowers must see a 3-step modal that explains default consequences before they can complete a draw. The modal blocks the draw flow until the user explicitly acknowledges all three steps. It can also be re-triggered at any time via the `?learn=1` URL query parameter.

First-time borrowers must see a 3-step modal that explains default consequences before they can complete a draw. The modal blocks the draw flow until the user explicitly acknowledges all three steps. It can also be re-triggered at any time via the `?learn=1` URL query parameter.

---

## Requirements

### 1 — 3-Step Modal Content

**REQ-1.1** The modal must contain exactly three steps presented in fixed order:

| Step | Title | Purpose |
|------|-------|---------|
| 1 | What is a Default? | Define default in plain language |
| 2 | Consequences of Default | Enumerate specific consequences (score impact, line suspension, collections) |
| 3 | How to Avoid Default | Actionable guidance (repay on time, monitor utilization, contact support) |

**REQ-1.2** Each step must display: a step title, a body paragraph, and a contextual icon.

**REQ-1.3** A step-indicator strip (1 / 2 / 3) must be visible at all times showing the current position, completed steps (checkmark), and upcoming steps. The strip must be announced to screen readers via `aria-current="step"`.

**REQ-1.4** Navigation must support Back (disabled on step 1) and Next (labeled "I Understand" on step 3). There must be no Skip affordance — the user must read through all steps.

**REQ-1.5** Animated step transitions must use `framer-motion` `AnimatePresence` (slide left/right), consistent with `OnboardingFlow.tsx`. Motion must be suppressed under `prefers-reduced-motion: reduce`.

---

### 2 — Flow Blocking

**REQ-2.1** The modal must render at the very beginning of `DrawCreditPage` — before step `"select"` is displayed — when either of the trigger conditions in REQ-3 is true.

**REQ-2.2** While the modal is open the underlying draw-wizard content must not be reachable by pointer, keyboard, or assistive technology. Specifically:
- `useInertBackdrop` must mark all non-modal DOM nodes as `inert`.
- `useBodyScrollLock` must prevent body scroll.
- Backdrop click must NOT close the modal (acknowledgement is mandatory).
- Escape key must NOT close the modal.

**REQ-2.3** The "I Understand" button on step 3 is the only affordance that closes the modal and advances the user into the draw flow.

---

### 3 — Trigger Conditions

**REQ-3.1 — First-time gate:** The modal must be shown when the localStorage key `creditra.default_risk_ack` is absent or falsy. After the user completes step 3 and clicks "I Understand", `creditra.default_risk_ack` must be written via `writeJson` (from `src/utils/storage.ts`) so the modal is not shown again on subsequent visits.

**REQ-3.2 — Learn mode:** The modal must also be shown when the URL contains the query parameter `?learn=1`, regardless of the localStorage value. Use `useSearchParams` from `react-router-dom` to read this param. When the modal is dismissed in learn mode, the `?learn=1` param must be removed from the URL (replace, no history entry) but the localStorage key must NOT be overwritten.

**REQ-3.3** Both trigger conditions are evaluated on mount; if neither applies the modal must not render.

---

### 4 — Accessibility

**REQ-4.1 — Dialog role:** The modal container must have `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the current step title, and `aria-describedby` pointing to the current step body.

**REQ-4.2 — Focus trap:** `useFocusTrap` (from `src/hooks/useFocusTrap.ts`) must be active while the modal is open. On open, focus must move to the first focusable element (Back or Next button). On close, focus must return to the element that triggered the draw flow (triggerRef pattern).

**REQ-4.3 — Visible focus ring:** All interactive elements (Back, Next/I Understand, step indicators if interactive) must display a `2px solid var(--accent)` outline on `:focus-visible`, inherited from the global rule in `src/index.css`. No custom override may suppress this.

**REQ-4.4 — Live region:** Step transitions must announce the new step title to screen readers via an `aria-live="polite"` region.

**REQ-4.5 — Keyboard navigation:** Tab and Shift+Tab must cycle only within the modal. Escape must produce no action (modal is mandatory — see REQ-2.2).

---

### 5 — Implementation Constraints

**REQ-5.1** The component must be implemented as `src/components/DefaultRiskModal.tsx` with a companion `DefaultRiskModal.css`. Inline styles are permitted only for dynamic values (token-derived colors); all structural styles must live in the CSS file.

**REQ-5.2** The component must accept these props:
```ts
interface DefaultRiskModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}
```

**REQ-5.3** Trigger logic (localStorage check + `?learn=1` detection) must live in `DrawCreditPage`, not inside the modal component itself. The modal is a pure presentational/interaction component.

**REQ-5.4** The `writeJson` / `readJson` utilities from `src/utils/storage.ts` must be used for all localStorage access — no raw `localStorage.setItem` / `getItem` calls.

**REQ-5.5** The localStorage key must be the string constant `'creditra.default_risk_ack'` defined as a named export from a new file `src/constants/storageKeys.ts`.

---

### 6 — Testing

**REQ-6.1** A test file `src/components/DefaultRiskModal.test.tsx` must cover:
- Modal renders when `isOpen` is true.
- Modal does not render when `isOpen` is false.
- Back button is disabled on step 1.
- Clicking Next advances from step 1 → 2 → 3.
- "I Understand" button appears only on step 3.
- `onAcknowledge` is called when "I Understand" is clicked.
- Escape key press does not call `onAcknowledge` and does not close the modal.
- Backdrop click does not call `onAcknowledge`.
- `aria-current="step"` is set on the active step indicator.
- Focus is present within the modal when open.

**REQ-6.2** A test file `src/pages/DrawCreditPage.test.tsx` (or augment existing) must cover:
- Modal is shown when `creditra.default_risk_ack` is absent from localStorage.
- Modal is NOT shown when `creditra.default_risk_ack` is `true` in localStorage.
- Modal IS shown when URL contains `?learn=1` even if localStorage key is set.
- Acknowledging the modal sets `creditra.default_risk_ack` in localStorage.
- Acknowledging in `?learn=1` mode removes the query param but does not re-write localStorage.

---

### 7 — Documentation

**REQ-7.1** A JSDoc block at the top of `DefaultRiskModal.tsx` must document: purpose, props, trigger conditions, WCAG 2.1 AA criteria satisfied (2.1.2, 2.4.3, 4.1.2, 1.4.1).

**REQ-7.2** `docs/UX_RATIONALE.md` must be updated with a section explaining why the modal is non-dismissible (user protection / GrantFox campaign requirement) and the `?learn=1` re-trigger mechanism.

---

## Out of Scope

- Backend persistence of acknowledgement (localStorage only for now).
- Multi-language / i18n support.
- Analytics/event tracking for modal completion.
- Any change to the draw wizard steps themselves.

---

## Glossary

| Term | Definition |
|------|-----------|
| Default | Failure to repay a drawn credit line per the agreed terms, resulting in account suspension and credit score impact. |
| Draw | A borrowing action — withdrawing funds from an approved credit line. |
| First-time borrower | A user who has never completed a draw on the Creditra platform (no prior `creditra.default_risk_ack` localStorage key). |
| Learn mode | A mode triggered by the `?learn=1` URL query parameter that re-shows the education modal regardless of prior acknowledgement. |
| Focus trap | A keyboard interaction pattern that constrains Tab/Shift+Tab focus cycling to within a modal dialog. |
| `creditra.default_risk_ack` | The localStorage key written after a user completes the education modal. |
