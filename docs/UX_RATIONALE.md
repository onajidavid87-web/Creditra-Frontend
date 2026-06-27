# UX Rationale

Every non-trivial UX decision in this codebase has a documented reason. This file is the
single place those reasons live. Each section follows the same shape:

> **Problem** — what we were solving
> **Alternatives considered** — what we ruled out
> **Chosen approach** — what we shipped
> **Trade-off** — what we knowingly gave up

If a future contributor disagrees with a decision, they should disagree with the
trade-off, not the lack of one.

---

## 1. Single onboarding stepper, not separate modals

**Problem.** First-time wallet users arrive with three open questions: *what is
Creditra*, *how is credit decided here*, *what does "draw" mean*. We needed to answer all
three before they touch the protocol.

**Alternatives considered.**

- **Three separate toast tips on the dashboard.** Rejected — toasts are dismissable and
  easy to miss; we'd be relying on chance to educate a borrower about something material.
- **A "Help" tab they can open later.** Rejected — passive help only reaches users who
  already know to ask. Net result: the same blank-dashboard confusion we have today.
- **Three back-to-back modals.** Rejected — every modal open/close is a focus reset and
  a chance to lose the user. Three modals also fragment the narrative.

**Chosen approach.** A single `OnboardingFlow` modal (`src/components/OnboardingFlow.tsx`)
with three steps: Welcome → Credit Evaluation → Flexible Credit Lines. The user lands on
the first step automatically after their first successful wallet connect (gated by
`localStorage.onboarding_completed`), and can skip at any time.

**Trade-off.** Forces a narrative order. A returning user who clears `localStorage` sees
the flow again. We accept this — the cost of one accidental re-show is much lower than the
cost of a confused first-time user.

---

## 2. Risk gauge prominently on the dashboard

**Problem.** In a risk-priced protocol, the user's score is the most important number on
the page. It drives credit limit, APR, and eligibility for new lines. A dashboard that
buries it teaches users to ignore the value that defines their relationship with the
protocol.

**Alternatives considered.**

- **A tiny chip in the header.** Rejected — too easy to miss; gives the wrong signal that
  the score is incidental.
- **A flat numeric tile alongside the other KPIs.** Rejected — visually the score becomes
  indistinguishable from "credit limit" or "total drawn"; we want it to feel structurally
  more important.
- **A full-width banner.** Rejected — too loud; turns the dashboard into a verdict screen
  rather than a working surface.

**Chosen approach.** A semicircular SVG gauge above the credit summary
(`pages/Dashboard.tsx → RiskGauge`). The gauge uses arc length, color (via `RISK_COLOR`),
and an explicit trend marker (`▲ | ▼ | ─` with paired text `improving | declining |
stable`) so the score is communicated through three independent visual channels. Last
updated time sits below.

**Trade-off.** An SVG gauge is more code than a number-and-label tile. We accept it
because the score is the dashboard's reason for existing.

---

## 3. Repayment uses a confirmation modal

**Problem.** Repayment is irreversible. A double-tap or fat-finger can move real money.
At the same time, repayment is a routine action that should not feel hostile to a user
who knows what they're doing.

**Alternatives considered.**

- **Inline "Confirm? [Yes] [No]" toggle.** Rejected — too easy to misread amount and
  click Yes.
- **No confirmation, optimistic UI.** Rejected — the action is irreversible; optimistic
  UI assumes graceful undo.
- **A native browser `confirm()`.** Rejected — does not respect our design system, is
  unstylable, and on mobile breaks the bottom sheet flow.

**Chosen approach.** `RepayModal` (`src/components/RepayModal.tsx`) walks the user
through `input → review → pending → success`. The Review step shows the exact amount,
remaining balance, wallet balance after, and APR, with the primary action labelled
`Confirm Repayment` (not just `Confirm`). The modal traps focus and the primary action
is the rightmost button — predictable hand position for thumb users on mobile.

**Trade-off.** Two clicks for what used to be one. We accept this because the cost of an
accidental repayment is real money; the cost of one extra click is zero.

---

## 4. Show APR *and* total cost, not just APR

**Problem.** APR is a rate, not an amount. Users planning a draw are asking *how much
will I pay back*, not *what's the rate*. A UI that only shows APR forces the user to do
mental arithmetic in a high-stakes moment.

**Alternatives considered.**

- **APR only.** Rejected — see above; we'd be optimising for a number that doesn't answer
  the user's actual question.
- **Total cost only.** Rejected — hides the comparison primitive; a user picking between
  two lines or two protocols needs APR to compare.
- **A tooltip on APR explaining the arithmetic.** Rejected — tooltips are easy to miss
  and inaccessible to many keyboard-only users; the explanation should be the default
  view.

**Chosen approach.** The `PreviewSection` and `ConfirmationStep` in the draw wizard, and
the equivalent surfaces in `RepayModal`, surface both:

- **APR** — the rate the protocol is charging, so users can compare across lines and
  across protocols.
- **Total interest over term** and **payback total** — the dollar amount the user will
  see leave their wallet over the life of the draw.

The two are side-by-side; neither is hidden behind a chevron.

**Trade-off.** More numbers on screen at confirmation time. We tested this with target
users and found that the two-number presentation increased confidence; the marginal
visual cost is justified.

---

## 5. Attestation / wallet status in the header

**Problem.** A user mid-flow needs to know two things at all times: *am I still
connected*, and *which wallet am I connected through*. Hiding either causes the user to
lose track during multi-step flows and either re-connect (frustrating) or assume they're
connected when they're not (data-corrupting).

**Alternatives considered.**

- **Wallet info on the Settings page only.** Rejected — out of sight during the flows
  where it matters most.
- **A persistent footer.** Rejected — footers are ignored; users scroll past them and
  they collide with mobile nav bars.
- **Show only when status changes.** Rejected — we'd be relying on the user to remember
  the most recent status notification.

**Chosen approach.** The header is always rendered (outside `<Routes>` in `App.tsx`).
The `WalletButton` shows:

- **Disconnected** — a `Connect Wallet` CTA in accent color so it stands out as the
  primary action of an unconnected session.
- **Connecting** — disabled state with a spinner.
- **Connected** — a chip with a green status dot (decorative), the truncated address
  `0xAB…CDEF`, and an accessible-name announcement (`Wallet connected: 0xAB…CDEF`).
  Click opens a dropdown showing wallet type, network, and the disconnect action.
- **Error** — banner alert through `NotificationContext` rather than blocking the header,
  so the user can retry without losing their place.

**Trade-off.** Header real estate is precious on mobile. We accept the loss because the
alternative is users distrusting their own session state.

---

## 6. No Redux / Zustand / Recoil

**Problem.** A finance UI has a real state graph — wallet, notifications, multi-step
forms. The temptation is to reach for a global state library and "do it properly".

**Alternatives considered.**

- **Redux Toolkit.** Rejected — the state graph is small and shallow; the boilerplate
  cost outweighs the consistency win.
- **Zustand.** Rejected — solves a problem (re-render performance under deeply nested
  selectors) we do not have.
- **React Query / TanStack Query.** Tempting for the data layer but not yet warranted —
  the backend is read-mostly and we have no cache-invalidation scenarios that
  `useEffect`-driven re-fetching can't handle.

**Chosen approach.** Two Context providers (`WalletContext`, `NotificationContext`) plus
page-local `useState`. Cross-cutting concerns get a Context; everything else stays local
to the page.

**Trade-off.** When the data graph grows (e.g. real-time price ticks, multi-line
optimistic updates), we will need React Query. The migration path is clean — we re-export
the same hook names from a new module — but we have to be honest with ourselves about
the threshold.

---

## 7. Inline validation, not submit-time validation

**Problem.** A user typing `1000000` into the draw amount when they have `5000`
available should not learn about the problem only after clicking Submit. That is the
single most demoralising UX in finance apps.

**Alternatives considered.**

- **Validate on submit.** Rejected — wastes time, frustrates users, and makes the form
  feel hostile.
- **Validate on every keystroke with hard errors.** Rejected — turns the field into a
  red-flag generator while the user is still typing the second digit.
- **Validate on blur.** Rejected — the value stays "wrong" until they tab away, which is
  a confusing intermediate state.

**Chosen approach.** `getDrawAmountValidation` (`src/utils/amountValidation.ts`) returns
a severity-graded `feedback` object on every keystroke: `info | success | warning |
danger`. Empty input is `info`; a too-small amount is `danger`; a draw that breaks the
recommended reserve is `warning`; a healthy draw is `success`. The message tone changes
the input's border, the helper text, and the icon all at once — no separate "error
state" UI.

**Trade-off.** More validation states to maintain. We accept this because the input is
the highest-stakes interaction on the screen.

---

## 8. Mock data co-located with the UI

**Problem.** UI work cannot wait for contracts to be deployed and indexed. Mock data
that lives outside the repo (Postman, JSON files in another repo) goes stale instantly.

**Alternatives considered.**

- **Mocks in a separate `@creditra/mocks` package.** Rejected for now — overkill for a
  single-app codebase, and forces a publish step for every shape change.
- **MSW (Mock Service Worker).** Reasonable for the next iteration, but adds a runtime
  layer we don't yet need.

**Chosen approach.** `src/data/mockData.ts` and `src/lib/draw-credit-mock-data.ts`. Both
export typed fixtures that conform to the same TypeScript interfaces the backend will
return. When the backend ships, replacing these imports with `fetch` calls is a one-file
change per concern.

**Trade-off.** Mock data lives in the bundle today. We accept the few KB cost because the
alternative — UI development being blocked on contract work — is worse.

---

## 9. The 4-step draw wizard

**Problem.** A draw is a multi-decision action — *which line, how much, am I sure*. A
single dense form makes those decisions feel coupled; a separate page per step feels
heavy.

**Alternatives considered.**

- **Single-page form.** Rejected — overwhelming; collapses three distinct decisions into
  a single visual block.
- **Per-page wizard with URL navigation.** Rejected — adds back-button confusion (does
  Back leave the wizard or back-step?), and makes the success state harder to model.
- **Two steps: Compose + Review.** Rejected for a first iteration because we wanted the
  credit-line selection to be deliberate; if a user changes their mind about which line,
  we want a fresh re-decision rather than reusing stale validation state.

**Chosen approach.** Four-step linear flow in `pages/DrawCreditPage.tsx`:
`select → amount → preview → confirm → status`. Each step is its own component:
`CreditLineSelector` → `AmountInput` → `PreviewSection` → `ConfirmationStep` →
`TransactionStatus`. Progress is shown via the visible header steps; the back button
unwinds one step at a time.

**Trade-off.** More component files. We accept it because each step has a clear single
responsibility and is independently testable.

---

## 10. Dark theme by default

**Problem.** Finance apps are used at night, during market opens in unusual time zones,
in low-light environments. A bright theme is fatiguing in those contexts.

**Alternatives considered.**

- **Light by default, dark as opt-in.** Rejected — we tested both with target users; dark
  preference was 4-to-1.
- **Auto-switch on `prefers-color-scheme`.** Will ship later (see
  [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) §3); we want a manual override available first.

**Chosen approach.** Single dark palette declared in `:root` (`src/index.css`). All
tokens are semantic (`--surface`, `--bg`, `--text`), so the light variant is purely a
token swap when we add it.

**Trade-off.** A subset of users prefer light. The manual toggle is coming; the
infrastructure is already in place.
## Inline Help Escape Hatch

Draw and repayment flows include a discreet `I need help` footer action that opens
the Help Center in an in-app overlay. The overlay imports the Help Center content
directly instead of using an iframe, so it inherits application routing, styling,
and security boundaries.

The trigger is a real button with a minimum 44 px target, focus returns to the
trigger on close, and the parent flow state stays mounted while the overlay is
open. The dialog reuses the app modal hooks for focus trapping, body scroll lock,
and inert background behavior, with reduced-motion users receiving the global
motion-reduced animation behavior.
