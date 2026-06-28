# PR Description

## Summary

This PR adds wallet address QR code support to the connected wallet dropdown so users can easily share or scan their address from another device during wallet-related flows.

## What changed

- Added a toggle in the wallet dropdown to show or hide a QR code for the connected wallet address.
- Generated the QR code client-side to keep the experience privacy-friendly and dependency-light.
- Improved the dropdown layout and accessibility for keyboard and screen-reader users.
- Added tests covering QR rendering, toggle behavior, and state reset logic.

## Why

Users connecting wallets often need a quick way to move the address to a phone or secondary device. This makes the wallet experience more practical for cross-device verification and transfers.

## Testing

- Ran `npx vitest run`
- Result: 26/26 test files passed and 120/120 tests passed
