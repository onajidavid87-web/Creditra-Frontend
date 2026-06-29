# Network status indicator

Persistent header control that reflects **browser connectivity** (`navigator.onLine`),
distinct from Stellar wallet network mismatch UI.

## Components

| File | Role |
| --- | --- |
| `src/components/NetworkStatus.tsx` | Indicator + screen-reader announcements |
| `src/components/NetworkStatus.css` | Theme-token styling |
| `src/layouts/Header.tsx` | Mounts `NetworkStatus` beside wallet/KYC actions |

## Visible behaviour

- **Online:** wifi icon, green dot, "Online" label (label visually hidden below 640px; icon + dot remain).
- **Offline:** wifi-off icon, red dot, "Offline" label.
- Colours use `--success` / `--error` so high-contrast overrides apply automatically.

## Accessibility

- Indicator exposes `aria-label="Network status: online|offline"`.
- State transitions announce via a screen-reader-only live region:
  - **Offline:** `role="alert"` + `aria-live="assertive"`.
  - **Restored:** `role="status"` + `aria-live="polite"`.
- No announcement on first paint (avoids noisy page load).

## API / integration

No new public hooks or REST endpoints. The component consumes the existing `useOnline()` hook
(`src/hooks/useOnline.ts`).

To reuse elsewhere:

```tsx
import { NetworkStatus } from '@/components/NetworkStatus';

<NetworkStatus />
```

## Related UI

- `OfflineBanner` — bottom toast with retry action (optional; not mounted in `App` today).
- `NetworkMismatchBanner` — wallet Stellar network mismatch (different concern).

## Tests

- `src/components/NetworkStatus.test.tsx` — unit coverage for labels, classes, SR announcements.
- `src/layouts/Header.test.tsx` — indicator present in header landmark.
- `src/App.test.tsx` — integration assertion in banner.

Run: `npm test -- --run NetworkStatus Header App.test`
