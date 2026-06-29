# Requirements Document

## Introduction

The default-risk education flow is a pre-borrow gate for the GrantFox campaign. Before a first-time borrower can complete a draw on the `/draw-credit` page, they must read and acknowledge a 3-step modal that explains the consequences of defaulting on a credit line. The modal blocks the draw flow until explicitly dismissed. It re-surfaces whenever the page is loaded with the `?learn=1` query parameter, allowing support links, help center articles, and campaign materials to force the education flow for any returning user who needs a refresher.

The feature must integrate cleanly with the existing `useFocusTrap`, `useBodyScrollLock`, and `useInertBackdrop` hooks already present in the codebase, follow the Creditra design token system, and ship with full test coverage.

## Glossary

- **Risk_Education_Modal**: The 3-step modal dialog that explains default consequences to a borrower before their first draw.
- **Draw_Flow**: The multi-step credit draw sequence on `/draw-credit`, implemented in `DrawCreditPage`.
- **First-Time_Borrower**: A user for whom the key `grantfox_risk_education_acknowledged` is absent or set to `false` in `localStorage`.
- **Acknowledged_State**: The state recorded in `localStorage` under `grantfox_risk_education_acknowledged` after a borrower completes all three steps and confirms.
- **Learn_Param**: The URL query parameter `?learn=1` that forces the Risk_Education_Modal to open regardless of the Acknowledged_State.
- **Step_Indicator**: The visual progress dots shown inside the modal representing the three content steps.
- **Focus_Trap**: The keyboard-focus containment mechanism provided by `useFocusTrap` that keeps Tab and Shift+Tab cycling within the modal while it is open.
- **GrantFox_Campaign**: The credit campaign context within which this education flow is required.
- **Storage_Util**: The `readJson` / `writeJson` helpers in `src/utils/storage.ts` used for all `localStorage` access.

## Requirements

### Requirement 1: Gate the Draw Flow for First-Time Borrowers

**User Story:** As a first-time GrantFox borrower, I want to see a clear explanation of default consequences before I borrow, so that I can make an informed decision about taking on credit.

#### Acceptance Criteria

1. WHEN a user navigates to `/draw-credit` and the Acknowledged_State is absent or `false`, THE Risk_Education_Modal SHALL render before any Draw_Flow step is visible.
2. WHEN the Risk_Education_Modal is open, THE Draw_Flow SHALL be non-interactive and hidden from assistive technology until the modal is dismissed.
3. WHEN a user navigates to `/draw-credit` and the Acknowledged_State is `true` and the URL does not contain `?learn=1`, THE Risk_Education_Modal SHALL NOT render, and the Draw_Flow SHALL be immediately accessible.

---

### Requirement 2: Three-Step Educational Content

**User Story:** As a first-time borrower, I want to read through three focused screens of default-risk information, so that I understand the full picture before proceeding.

#### Acceptance Criteria

1. THE Risk_Education_Modal SHALL contain exactly three sequential steps: (1) What is a Default, (2) Consequences of Default, (3) How to Avoid Default.
2. WHEN the modal is on step 1 or step 2, THE Risk_Education_Modal SHALL display a "Next" button that advances to the following step.
3. WHEN the modal is on step 2 or step 3, THE Risk_Education_Modal SHALL display a "Back" button that returns to the previous step.
4. WHEN the modal is on step 1, THE Risk_Education_Modal SHALL render the "Back" button in a disabled state.
5. WHEN the modal is on step 3, THE Risk_Education_Modal SHALL replace the "Next" button label with "I Understand – Proceed".
6. THE Risk_Education_Modal SHALL display a Step_Indicator showing the current step position and total step count at all times.
7. THE Risk_Education_Modal SHALL announce the current step to assistive technology via an `aria-live="polite"` region.

---

### Requirement 3: Block Completion Until All Steps Are Acknowledged

**User Story:** As a product owner, I want borrowers to read through all three steps before proceeding, so that no user can skip the educational content.

#### Acceptance Criteria

1. WHEN the modal is on step 1 or step 2, THE Risk_Education_Modal SHALL NOT render a final confirmation action that closes the modal and unblocks the Draw_Flow.
2. WHEN the user activates "I Understand – Proceed" on step 3, THE Risk_Education_Modal SHALL write `true` to `localStorage` under the key `grantfox_risk_education_acknowledged` using the Storage_Util `writeJson` helper.
3. WHEN the user activates "I Understand – Proceed" on step 3, THE Risk_Education_Modal SHALL close and the Draw_Flow SHALL become interactive.
4. IF the Storage_Util `writeJson` call fails silently (quota exceeded, private mode), THEN THE Risk_Education_Modal SHALL still close and the Draw_Flow SHALL still unblock, accepting that the acknowledgement will not persist.

---

### Requirement 4: Re-Show on `?learn=1` Query Parameter

**User Story:** As a support agent, I want to link borrowers back to the education flow using `?learn=1`, so that I can give returning users a refresher without requiring them to clear their browser data.

#### Acceptance Criteria

1. WHEN a user navigates to `/draw-credit?learn=1` and the Acknowledged_State is `true`, THE Risk_Education_Modal SHALL open and display from step 1.
2. WHEN a user navigates to `/draw-credit?learn=1` and the Acknowledged_State is `false` or absent, THE Risk_Education_Modal SHALL open and display from step 1.
3. WHEN the modal opened via `?learn=1` is completed, THE Draw_Flow page SHALL update the URL by removing the `?learn=1` parameter without adding a browser history entry.
4. WHEN the modal opened via `?learn=1` is completed, THE Risk_Education_Modal SHALL write `true` to `localStorage` under `grantfox_risk_education_acknowledged`.

---

### Requirement 5: Keyboard Accessibility and Focus Trap

**User Story:** As a keyboard-only user, I want focus to be contained within the modal while it is open, so that I cannot accidentally interact with background content.

#### Acceptance Criteria

1. WHEN the Risk_Education_Modal opens, THE Risk_Education_Modal SHALL move keyboard focus to the first focusable element inside the dialog using the `useFocusTrap` hook.
2. WHILE the Risk_Education_Modal is open, THE Risk_Education_Modal SHALL cycle keyboard focus between interactive elements inside the dialog when the user presses Tab or Shift+Tab, preventing focus from leaving the modal.
3. WHILE the Risk_Education_Modal is open, THE Risk_Education_Modal SHALL lock body scroll using the `useBodyScrollLock` hook.
4. WHILE the Risk_Education_Modal is open, THE Risk_Education_Modal SHALL mark background content as inert using the `useInertBackdrop` hook with the modal element's id.
5. WHEN the Risk_Education_Modal closes, THE Risk_Education_Modal SHALL return keyboard focus to the element that had focus before the modal opened.
6. THE Risk_Education_Modal SHALL NOT close on Escape key press, because acknowledgement of all three steps is required before the Draw_Flow is unblocked.

---

### Requirement 6: Visible Focus Ring

**User Story:** As a keyboard or switch-access user, I want a clearly visible focus indicator on all interactive elements inside the modal, so that I always know which element I am about to activate.

#### Acceptance Criteria

1. WHEN a button inside the Risk_Education_Modal receives keyboard focus, THE Risk_Education_Modal SHALL display a `2px solid` focus ring using the `--accent` CSS custom property (`#58a6ff`) with `outline-offset: 2px`, matching the global `:focus-visible` rule in `src/index.css`.
2. THE Risk_Education_Modal SHALL use the `:focus-visible` pseudo-class so that the focus ring does not appear for mouse or touch interactions.
3. WHEN the "Back" button is in a disabled state on step 1, THE Risk_Education_Modal SHALL suppress the focus ring on that element and set `tabindex="-1"` to remove it from the tab order entirely.

---

### Requirement 7: ARIA Semantics and Screen Reader Support

**User Story:** As a screen reader user, I want the modal to be correctly identified as a dialog with a labelled title, so that my assistive technology announces the correct context when the modal opens.

#### Acceptance Criteria

1. THE Risk_Education_Modal SHALL render the dialog container with `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal's visible title element.
2. THE Risk_Education_Modal SHALL include an `aria-describedby` attribute on the dialog container pointing to the step description paragraph for the current step.
3. WHEN the step content changes, THE Risk_Education_Modal SHALL update the `aria-describedby` reference to reflect the new step's description.
4. THE Step_Indicator SHALL include an `aria-label` on each dot indicating its step number and whether it is complete, current, or upcoming (e.g., "Step 2 of 3 – current").
5. THE Risk_Education_Modal SHALL set `aria-disabled="true"` and `tabindex="-1"` on the "Back" button when it is in the disabled state on step 1.

---

### Requirement 8: Persistence via localStorage

**User Story:** As a returning borrower, I want the modal to be skipped on subsequent visits once I have completed it, so that I am not interrupted every time I draw credit.

#### Acceptance Criteria

1. THE Risk_Education_Modal SHALL read the Acknowledged_State from `localStorage` key `grantfox_risk_education_acknowledged` using the Storage_Util `readJson` helper with a fallback of `false`.
2. WHEN the Acknowledged_State is `true` and the Learn_Param is absent, THE Risk_Education_Modal SHALL not mount, keeping the component tree lightweight.
3. THE Risk_Education_Modal SHALL write the Acknowledged_State through the Storage_Util `writeJson` helper only after the user activates the final confirmation action on step 3.
4. FOR ALL storage read calls, THE Risk_Education_Modal SHALL handle storage unavailability (private browsing, quota exceeded) by treating the result as if the acknowledgement has not been given, showing the modal.

---

### Requirement 9: Animation and Motion Sensitivity

**User Story:** As a user with vestibular disorders, I want the modal to respect my operating system's reduced-motion preference, so that step transitions do not cause discomfort.

#### Acceptance Criteria

1. THE Risk_Education_Modal SHALL animate step transitions using `framer-motion`'s `AnimatePresence` and `motion.div`, matching the existing pattern in `OnboardingFlow.tsx`.
2. WHERE the user has enabled `prefers-reduced-motion: reduce`, THE Risk_Education_Modal SHALL suppress slide and fade animations on step transitions, matching the `@media (prefers-reduced-motion: reduce)` block in `OnboardingFlow.css`.

---

### Requirement 10: Round-Trip Persistence Integrity

**User Story:** As a QA engineer, I want to verify that the acknowledgement flag written to localStorage is readable back as the same value, so that I can confirm the gate logic is reliable across page loads.

#### Acceptance Criteria

1. FOR ALL valid acknowledgement writes, reading `grantfox_risk_education_acknowledged` from `localStorage` using the Storage_Util `readJson` helper SHALL return `true` immediately after the write.
2. FOR ALL valid acknowledgement writes, reloading the page at `/draw-credit` with no `?learn=1` param SHALL result in the Risk_Education_Modal not rendering (round-trip gate test).
