# Accessibility

Creditra commits to **WCAG 2.1 AA** conformance, with selected 2.2 AAA criteria (target
size 44 px) adopted as defaults. This document is both the policy and the implementation
reference.

The frontend is reviewed for accessibility on every PR. The checklist in the root README
is the bare minimum; the per-pattern guidance below is how individual components are
expected to behave.

---

## 1. Why AA, not A or AAA

- **AA is the legal baseline** under most public-procurement, EU, and US accessibility
  regulations. Anything less is a future liability.
- **AAA is component-by-component achievable**, not platform-wide — for example, AAA
  contrast (7:1) breaks data-density on the Transactions table without an alternate view.
  We hold the line at AA but cherry-pick AAA where it costs nothing (target size, focus
  rings).
- **The protocol handles money.** A user who cannot reliably operate the repay flow is a
  user we have actively harmed. Accessibility is not a marketing checkbox here.

The four POUR principles drive every decision:

1. **Perceivable** — every signal has a non-color form (glyph, text, ARIA).
2. **Operable** — every action is keyboard-reachable in a logical order.
3. **Understandable** — errors are inline, specific, and recoverable.
4. **Robust** — semantic HTML first; ARIA only when no native element fits.

---

## 2. Per-pattern guidance

### Modals and sheets

Every modal **must** compose all three a11y hooks:

| Hook | File | Role |
| --- | --- | --- |
| `useFocusTrap` | `src/hooks/useFocusTrap.ts` | Tab/Shift+Tab cycling, Escape close, return-focus to trigger |
| `useBodyScrollLock` | `src/hooks/useBodyScrollLock.ts` | Freeze background scroll, preserve scroll position |
| `useInertBackdrop` | `src/hooks/useInertBackdrop.ts` | `inert` (or `aria-hidden` fallback) on everything outside the modal |

The canonical example is `src/components/WalletConnectionModal.tsx`. The modal container
also sets `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing at the
heading.

### Tables (Transactions, Credit Lines)

- Column headers are `<th scope="col">` with a `<button>` child for sortable columns;
  pressing Enter/Space toggles sort.
- `aria-sort="ascending|descending|none"` is set on the active column header.
- Row order is the visual order; no reordering of DOM relative to layout.
- Filter chips are styled `<button>`s with `aria-pressed` reflecting the toggle state.
- Notification filters use the WAI-ARIA tab pattern: the group has `role="tablist"`,
  each filter has `role="tab"`, the active filter sets `aria-selected="true"`, and
  Arrow/Home/End keys move focus and selection.

### Forms

- Every input is wrapped by `<FormField>` (`src/components/FormField.tsx`) which
  programmatically wires `htmlFor` ↔ `id`, sets `aria-describedby` to a space-separated
  list of help + error IDs, sets `aria-invalid` on error, and emits `aria-required` when
  marked required.
- Error messages are rendered through `<FormMessage>` with `role="alert"` so screen
  readers announce them on appearance.
- Inline validation does not block typing; it transitions the message tone from `info` →
  `success`/`warning`/`danger` per `getDrawAmountValidation` in
  `src/utils/amountValidation.ts`.
- Submit buttons use `<PendingButton>` so `aria-busy="true"` is set during the request
  and the label changes (`Submit` → `Submitting…`) to communicate state.

### Menus and dropdowns

- Trigger has `aria-haspopup="true"`, `aria-expanded={open}`, and an `aria-label`
  describing what opens.
- Menu items use `role="menuitem"`.
- Escape closes; click-outside closes; focus returns to the trigger.
- Example: `WalletButton.tsx` connected state — `aria-haspopup` and `aria-expanded` on the
  address chip, `role="menu"` on the dropdown.

### Status badges and gauges

- `StatusBadge` pairs a tinted pill with a single-letter glyph (`A | ! | X | C`). Color is
  never the sole signal.
- Risk gauge uses `<text>` SVG nodes for the score and a separate `<text>` for the trend
  arrow (`▲ | ▼ | ─`) plus the trend word as a sibling element so screen readers don't
  miss it.

### Live regions

| Use | Politeness | Component |
| --- | --- | --- |
| Form field errors | `role="alert"` (assertive) | `FormMessage` |
| Copy-to-clipboard success | `aria-live="polite"` | `CopyToClipboard` |
| Route changes | `role="status" aria-live="polite"` | `RouteAnnouncer` |
| Post-action confirmation | `role="status" aria-live="polite"` | `SuccessState` |
| Toast notifications | Polite `ToastContainer` live region for confirmations; individual error toasts escalate to `role="alert"` | `ToastContainer` |

### Focus management

- Global `:focus-visible` rule in `src/index.css` is `outline: 2px solid var(--accent); outline-offset: 2px`.
- Active nav links keep focus styling distinct from active styling (see the comment block
  around `.header-nav-link.active` in `src/index.css`).
- Modal close returns focus to the trigger via `useFocusTrap`'s `triggerRef`.

---

## 3. Component audit

The table below is updated on every accessibility-impacting PR. Status legend:
**OK** = audited and passing, **TODO** = known gap with target fix below.

| Component | Keyboard | ARIA | Contrast | Motion | Status |
| --- | --- | --- | --- | --- | --- |
| `WalletButton` | Tab/Enter/Esc; trigger has `aria-haspopup`/`aria-expanded` | `aria-label` on icon-only states | AA | n/a | OK |
| `WalletConnectionModal` | Focus trap + return; Escape closes | `role="dialog"`, `aria-modal`, `aria-labelledby` | AA | reduced-motion gated | OK |
| `ShortcutHelpOverlay` | Global `?` trigger outside text inputs; Escape closes; focus returns | `role="dialog"`, `aria-modal`, grouped shortcut lists | AA | reduced-motion gated | OK |
| `OnboardingFlow` | Arrow keys advance steps (planned), Esc skips | Stepper labelled via `aria-label` | AA | `useReducedMotion()` | OK |
| `FormField` | Native input semantics | Auto `htmlFor`, `aria-describedby`, `aria-invalid`, `aria-required` | AA | n/a | OK |
| `FormMessage` | n/a (text only) | `role="alert"` on error | AA | reduced-motion gated | OK |
| `AmountInput` | Native input + preset buttons; Tab in order | `aria-describedby` aggregates helper/constraint/status/error | AA | n/a | OK |
| `PendingButton` | Disabled during pending; Enter submits | `aria-busy="true"` while pending | AA | n/a | OK |
| `StatusBadge` | n/a (display) | `aria-label="Credit line status: …"` | AA | n/a | OK |
| `Skeleton` | n/a | n/a | n/a | reduced-motion gated | OK |
| `CopyToClipboard` | Real `<button>`; Enter copies | Specific `aria-label`; polite live region announces "Copied" | AA | n/a | OK |
| `AccessibleTooltip` | Trigger is keyboard-focusable | `role="tooltip"`, `aria-describedby` | AA | n/a | OK |
| `RouteAnnouncer` | n/a (route observer) | Updates `document.title`, meta description, and a polite live region | AA | n/a | OK |
| `NotificationBell` | Tab/Enter; counter is decorative | `aria-label="Notifications, N unread"` | AA | n/a | OK |
| `NotificationCenter` | Focus trap inside the panel; mobile Expand/Collapse snap controls for keyboard users | `role="dialog"`, category filters use `role="tab"` + `aria-selected`; iOS safe-area insets on bottom sheet | AA | reduced-motion disables snap transitions | OK |
| `ToastContainer` | Tab/Esc to dismiss | `role="status"` / `role="alert"` per severity | AA | reduced-motion gated | OK |
| `BannerAlert` | Tab/Enter on action & dismiss | `role="alert"` for warning/error | AA | n/a | OK |
| `Dashboard` (risk gauge) | n/a | Score and trend exposed via `<title>` + polite `sr-only` sibling; arc animates on value change with reduced-motion fallback | AA | reduced-motion gated (CSS + JS `matchMedia`) | OK |
| `Header` nav | Tab through links; Enter activates | `aria-current="page"` on active link | AA | n/a | OK |
| `RepayModal` | Focus trap (canonical `{ isActive }` form) + return focus to trigger | `role="dialog"`, `aria-modal`, `aria-labelledby` | AA | n/a | OK |
| `TransactionHistory` | Sortable headers via Enter/Space | `aria-sort` reflects column state | AA | n/a | OK |
| `HelpCenter` | Accordion buttons and transcript links are keyboard reachable | Video thumbnails are real buttons; iframe created only after opt-in | AA | n/a | OK |
| `SupportWidget` | Floating trigger, search field, FAQ toggles, and email handoff are keyboard reachable | `aria-expanded`, `aria-controls`, visible focus ring, non-modal `role="dialog"` shell | AA | n/a | OK |
| `LandingPage` | Tab through CTAs and FAQ accordion | Framer Motion guarded by `useReducedMotion` | AA | reduced-motion gated | OK |
| `ErrorBoundary` / `ErrorPage` | Tab through "Go back" and "Reload" | Semantic landmarks | AA | n/a | OK |

### Known gaps and target fix dates

| ID | Component | Gap | Target |
| --- | --- | --- | --- |
| A11Y-001 | `OnboardingFlow` | Arrow-key step navigation not wired (today uses Next/Back buttons only) | next minor release |
| ~~A11Y-002~~ | ~~`RepayModal`~~ | ~~Focus-trap call site uses legacy boolean signature; needs migration to `useFocusTrap({ isActive })`~~ | **Fixed** — migrated to `{ isActive }` form; `triggerRef` wired; regression test added |
| A11Y-003 | `NotificationCenter` | Filter tabs use `aria-pressed` but should additionally expose `role="tab"` + `aria-selected` for AT consistency | next minor release |
| ~~A11Y-004~~ | ~~Tables~~ | ~~`aria-sort` is set but caption text describing the table is not yet announced~~ | **Closed** — `<caption>` added to TransactionHistory; `<section aria-label>` added to CreditLines; both update dynamically with filter state |

---

## 4. Touch targets

All interactive elements meet **44×44 CSS px**, derived from:

- WCAG 2.5.5 (AAA, 44×44 recommended)
- WCAG 2.5.8 (AA in 2.2, 24×24 minimum with spacing)
- Apple HIG 44 pt minimum
- Material Design 48 dp recommended

Use `min-width` / `min-height` (not fixed) so labels can grow with content. The canonical
pattern:

```css
.icon-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0.625rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.compact-text-btn {
  min-height: 44px;
  padding: 0.625rem 0.5rem;
  display: inline-flex;
  align-items: center;
}
```

### Audited targets

| Component | Element | Before | After | Compliant |
| --- | --- | --- | --- | --- |
| `NotificationBell` | `.notif-bell` | ~30×30 | 44×44 | yes |
| `WalletConnectionModal` | `.close-btn` | 32×32 | 44×44 | yes |
| `NotificationCenter` | `.nc-icon-btn` | ~24×24 | 44×44 | yes |
| `NotificationCenter` | `.nc-close-btn` | ~24×24 | 44×44 | yes |
| `NotificationCenter` | `.nc-text-btn` | ~20 h | 44 h | yes |
| `NotificationCenter` | `.nc-filter-tab` | ~20 h | 44 h | yes |
| `NotificationCenter` | `.nc-item-action` | ~20 h | 44 h | yes |
| `BannerAlert` | `.banner-close` | ~20×20 | 44×44 | yes |
| `BannerAlert` | `.banner-action` | ~20 h | 44 h | yes |
| `ToastContainer` | `.toast-close` | ~20×20 | 44×44 | yes |
| `TransactionHistory` | `.export-btn` | ~32 h | 44 h | yes |
| `Dashboard` | `.wallet-address-chip` | ~32 h | 44 h | yes |
| `WalletButton` | `.connect-wallet-btn` | 44 h | 44 h | yes (already) |
| `WalletButton` | `.wallet-address-btn` | 44 h | 44 h | yes (already) |
| `WalletButton` | `.disconnect-btn` | 44 h | 44 h | yes (already) |

### Display-only exceptions

`network-badge`, `nc-badge`, `notif-bell-badge`, `status-badge`, `status-dot`, progress
bars and utilization bars are informational, not interactive, and are exempt from the
target rule.

---

## 5. Copy to clipboard contract

The shared `CopyToClipboard` component is the only sanctioned way to copy a wallet address
or transaction hash. Its contract:

- Renders a real `<button>` (never a `<div role="button">`).
- Pairs a visible `Copy` label with an icon; the icon is `aria-hidden`.
- Provides a specific `aria-label` like `Copy connected wallet address` or
  `Copy transaction hash for TX-001` when the value itself is not fully visible.
- On success, label flips to `Copied` for `COPY_FEEDBACK_DURATION_MS` (2000 ms) and a
  polite live region announces the change to screen readers.
- Keeps focus on the button so keyboard flow is unbroken.

---

## 6. Reduced motion

Every animation in the codebase is gated by
`@media (prefers-reduced-motion: reduce)`. Inventory:

- `src/index.css` — two top-level reduced-motion blocks
- `src/components/Skeleton.css`
- `src/components/OnboardingFlow.css`
- `src/components/WalletConnectionModal.css`
- `src/components/FormField.css`
- `src/components/LandingPage.css`

JS-driven animations (Framer Motion) call `useReducedMotion()` and switch to instant
state changes. The landing hero in `src/components/LandingPage.tsx` is the canonical
example.

---

## 7. Testing tools

| Tool | Use |
| --- | --- |
| `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` | Component and integration tests — query by role, simulate real keyboard events |
| `vitest` | Test runner |
| `jsdom` | DOM environment for tests (configured in `vitest.config.ts`) |
| **axe-core / @axe-core/react** | Recommended addition for automated CI scanning |
| **Lighthouse** (browser DevTools or CI) | Per-route accessibility audit, drives the score reported in `PERFORMANCE.md` |
| Manual screen-reader checks | VoiceOver (macOS), NVDA (Windows), TalkBack (Android) before any release that ships overlay or form changes |

Manual checklist before merging accessibility-impacting work:

1. Disconnect the mouse; navigate the full flow with Tab/Shift+Tab/Enter/Space/Esc.
2. Toggle `prefers-reduced-motion` in OS settings; confirm no animation plays.
3. Toggle Forced Colors (Windows) or Increase Contrast (macOS); confirm nothing
   disappears.
4. Run a screen reader through the changed surface and confirm errors, statuses, and
   live-region updates are announced.

---

## 8. Component-author checklist

Use this when adding or changing a UI surface. PRs that touch UI without this checklist
are bounced.

- [ ] Native HTML element used wherever possible (`button`, `a`, `label`, `nav`,
      `header`, `main`, `dialog`).
- [ ] Every icon-only control has `aria-label`.
- [ ] Every form field uses `<FormField>` or replicates its label/help/error wiring.
- [ ] Color is never the sole signal — glyph, text, or icon backs it up.
- [ ] Touch targets ≥ 44×44 px.
- [ ] Focus is visible and logically ordered.
- [ ] Modals compose `useFocusTrap` + `useBodyScrollLock` + `useInertBackdrop`.
- [ ] All animation is gated by `prefers-reduced-motion`.
- [ ] Contrast meets AA against the surface it sits on (`COLOR.surface` for cards,
      `COLOR.bg` for the page).
- [ ] Screen-reader announcements are routed through a live region with the right
      politeness.
