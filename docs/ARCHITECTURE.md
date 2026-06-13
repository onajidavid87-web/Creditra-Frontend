# Architecture Overview

This document is a high-altitude map of the Creditra frontend codebase.
Use it to orient yourself before diving into a specific feature.

## Top-level layout

```
src/
├── App.tsx              Routes + global providers
├── main.tsx             ReactDOM bootstrap, error boundary at the root
├── pages/               Route-level components (Dashboard, CreditLines, …)
├── components/          Reusable UI primitives and composite blocks
├── context/             Cross-cutting React Context providers
├── hooks/               Reusable hooks (focus trap, scroll lock, …)
├── utils/               Pure helpers — formatting, validation, storage
├── types/               Shared TypeScript interfaces and discriminated unions
├── lib/                 Mock data and external integrations
└── test/                Vitest setup and shared test utilities
```

## Data flow

The app is a classic client-rendered SPA:

1. `main.tsx` mounts `<App />` inside a top-level `ErrorBoundary`.
2. `App.tsx` wires up `BrowserRouter`, `WalletProvider`, and
   `NotificationProvider`, then renders the route tree.
3. Pages read from context (`useWallet`, `useNotifications`) and call
   into utilities for formatting and validation.
4. Components are kept stateless when possible. State that is shared
   across screens lives in a context provider; state that is local to a
   single screen lives in the page component.

## State management

We deliberately avoid Redux / Zustand / Recoil. The store boils down to:

- `WalletContext` for connection lifecycle and the current public key.
- `NotificationContext` for toast and banner alerts.
- Local component state for everything else.

## Accessibility primitives

`useFocusTrap`, `useBodyScrollLock`, and `useInertBackdrop` are the
shared building blocks for any modal or sheet. Every overlay should
compose all three.

## Design tokens

Color, spacing, and motion tokens live in `src/utils/tokens.ts` and are
documented in `Design System/tokens.md`. Avoid introducing one-off hex
values — extend the token table instead.
