# WORKSTATE

## Current Status (March 21, 2026)
- **Phase 3 (Hardening & TS Conversion) Complete:** The mobile PWA source files have been successfully converted to TypeScript (`.ts`) and integrated into the build pipeline.
- **TypeScript Errors (0):** Both the root Next.js project and the mobile PWA sub-project now pass `tsc --noEmit` with zero errors.
  - Root project: `public/mobile-app` is excluded to avoid strict `implicit any` collisions.
  - Mobile project: Uses a dedicated `public/mobile-app/tsconfig.json` for independent verification.
- **Testing (100% Green):**
  - **Unit Tests:** `npm run test:unit` passes 1,456 tests.
  - **E2E Tests:** `npx playwright test` passes all shards, including the new `mobile-pwa-goldens.spec.js`.
- **Mobile Build:** `npm run build:mobile` successfully stitches components from the new `index.template.html` and compiles `.ts` files via `esbuild`.

## CI Readiness
- **build-and-unit job:** Verified (tsc clean, unit tests pass, next build pass).
- **e2e shards:** Verified (all playwright tests passing).
- **Security Audit:** Pass (npm audit check).

## Project Focus Shift
- **Priority:** Desktop PWA and Mobile PWA.
- **Landing Page:** Stable/Maintenance only. I will begin pruning low-value landing page tests to keep CI fast, keeping only critical paths (Signup, Core Flow, Sanity).

## Recent Fixes
- **Viewport Zoom:** Locked `viewport-fit=cover` and `user-scalable=no` to prevent accidental pinch-to-zoom on mobile devices.
- **RSVP Atomic Toggle:** Hardened `toggle_event_rsvp_atomic` RPC to be idempotent. The API and client now pass explicit `action: add|remove` intents so an out-of-sync client doesn't accidentally cancel a user's registration.
- **Event Spot Limits:** Removed the confusing `paid` check logic. The client now instantly blocks RSVP to *any* full event without requiring a server round-trip to fail.
- **Realtime Messaging Sync:** Fixed a bug where a chat screen wouldn't live-update when a new message arrived via Supabase Realtime. `updateConversationsFromAPI` now actively re-renders the current thread if open.
- **Push Notifications Opt-in:** Updated the Settings toggle to properly invoke the native `Notification.requestPermission()` prompt via explicit user gesture. Note: Browsers (especially iOS Safari) strictly forbid prompting for notifications on initial load/install without a physical tap, so this cannot be fully automated.
