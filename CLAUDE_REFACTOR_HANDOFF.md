# Claude Refactor Handoff

You are refactoring a real production-bound tennis club app with 3 surfaces:
- landing website
- desktop dashboard webapp
- mobile PWA

This is a phased maintainability refactor, not a broad rewrite.

Current project state:
- a major visual polish pass has already been completed across the landing site, desktop dashboard, and mobile PWA
- mobile login/session/logout behavior has already been hardened
- announcement delivery now has protected behavior:
  - audience filtering
  - announcement opt-out via notification preferences
  - bell notification delivery for opted-in members
  - push delivery for opted-in members
  - inbox message delivery for opted-in members
- court blocks already have protected cancellation side effects:
  - cancel conflicting bookings
  - notify affected members
  - send cancellation email flow

Important design instruction:
- do not redesign the app again
- preserve the current visual system and polish direction
- this refactor is now about structure, maintainability, and safer modularization
- if you touch UI code, preserve current appearance unless a tiny parity fix is required

Your mission:
Make the codebase safer and easier to maintain in small controlled passes, while preserving current behavior.

Non-negotiable rule:
Do not endanger launch-critical flows.

Launch-critical flows:
- PIN login
- session recovery / stale-session handling
- logout returning cleanly to login
- dashboard access
- booking a court
- adding participants
- participant notifications
- booking emails
- messaging
- partner finding
- RSVP to events
- admin announcements
- admin announcements respecting announcement opt-out
- admin announcements creating inbox messages for opted-in members
- court blocking / booking auto-cancel
- mobile PWA navigation and login shell

Important instruction:
Do not do all 3 phases in one giant pass.

Only do:
- Phase 1
- Phase 2

Stop after Phase 2 and report results.

Do not proceed into Phase 3 or any broader rewrite unless explicitly asked after review.

Reason:
This app is close to production use, so the refactor must stay controlled, reviewable, and low-risk.

Preferred approach:
Complete Phase 1 and Phase 2 only, then stop for review.
A separate review/hardening pass will happen afterward before any further refactor work is approved.

General constraints:
- preserve routes
- preserve env var names
- preserve API contracts
- preserve current UI and styling
- preserve DOM hooks/IDs/classes where existing JS depends on them
- preserve Safari/WebKit behavior
- preserve mobile/tablet/desktop behavior
- do not introduce a new architecture or state library
- do not redesign
- do not remove working logic without understanding all side effects
- preserve current visual polish and premium surface styling
- preserve current mobile login/logout/session handoff behavior
- preserve current admin announcement preference logic

High-risk files:
- `public/mobile-app/index.html`
- `public/mobile-app/js/admin.js`
- `app/dashboard/lib/store.tsx`

Work in exactly 3 phases.

## Phase 1: Safe Extraction Only

Goal:
Reduce risk and improve readability without changing behavior.

Allowed:
- extract helper functions
- extract constants
- extract small utility modules
- split repeated logic into shared helpers
- add light internal organization
- improve naming where safe
- add minimal comments only where needed

Not allowed:
- changing public behavior
- changing state shape
- changing DOM structure in risky areas
- changing request sequencing
- changing component responsibilities dramatically

Focus:
- small repeated logic in `app/dashboard/lib/store.tsx`
- shared admin helper logic from `public/mobile-app/js/admin.js`
- repeated URL/helper/formatting logic across APIs
- low-risk structure cleanup in `public/mobile-app/index.html` only if it does not alter DOM hooks

Deliverables for Phase 1:
1. summary of extracted helpers/modules
2. tests run
3. files changed
4. any high-risk areas intentionally deferred

## Phase 2: Controlled Modularization

Only proceed after Phase 1 is stable.

Goal:
Break up oversized files into focused internal modules while preserving behavior.

Allowed:
- split `admin.js` into focused concerns
- split parts of `store.tsx` into helper modules/selectors/actions
- isolate repeated mobile PWA screen logic
- reduce file size and mixed concerns

Not allowed:
- changing product behavior
- changing core auth/session flow
- changing notification semantics
- changing booking semantics
- changing admin feature semantics
- changing current UI structure beyond what is necessary for modularization
- weakening or removing the current announcement opt-out + inbox-message behavior
- weakening or removing the current logout/session recovery behavior

Specific targets:
1. `public/mobile-app/js/admin.js`
   Split by concern if safe:
   - announcements
   - court blocks
   - members
   - shared admin helpers

2. `app/dashboard/lib/store.tsx`
   Split by concern if safe:
   - auth/session helpers
   - booking state/actions
   - notifications/realtime sync
   - derived selectors/utilities

3. `public/mobile-app/index.html`
   Only do deeper modular cleanup if it is safe with current scripts/tests.
   If not safe, leave large structural changes out and explicitly say so.

Deliverables for Phase 2:
1. what modules were created
2. what large files got smaller
3. what behavior was preserved
4. tests run
5. what was intentionally not refactored because risk was too high

## Phase 3: Hardening + Verification

Goal:
Make sure the refactor is trustworthy.

Required:
- run typecheck
- run relevant unit tests
- run targeted Playwright tests for touched behavior
- fix stale tests only when behavior is unchanged and the test assumption is outdated
- report remaining risk honestly

Prioritize these tests when relevant:
- `tests/signup.spec.js`
- `tests/apple-compat.spec.js`
- `tests/chromium-compat.spec.js`
- `tests/mobile-pwa-session.spec.js`
- mobile PWA tests
- admin/court-block tests
- notification-related unit tests
- booking-related unit tests
- `unit-tests/announcement-delivery-runtime.test.js`
- `unit-tests/court-blocks-runtime.test.js`
- `unit-tests/announcement-integration.test.js`
- `unit-tests/notification-channels.test.js`

If failures happen:
- identify whether it is a regression or stale test
- fix carefully
- do not paper over failures

Deliverables for Phase 3:
1. final summary
2. full changed file list
3. tests run and results
4. remaining risks
5. recommendation: safe to continue / safe to ship / needs more work

## App-Specific Guardrails

### Landing website
- Preserve layout and copy structure
- Preserve responsive behavior
- Preserve info page tabs and URL/tab sync
- Preserve Safari/WebKit compatibility
- Do not redesign sections or typography system
- Focus on extracting repeated tab/layout/helper logic if present

### Desktop dashboard webapp
- Preserve store behavior
- Preserve route protection
- Preserve current API interaction flow
- Preserve notification and booking side effects
- Preserve the current premium visual shell and hierarchy
- If refactoring store/state logic, do it incrementally and preserve action order
- Do not convert everything to a new state architecture

### Mobile PWA
- Preserve HTML structure needed by existing JS
- Preserve screen IDs, key DOM hooks, nav IDs, and selectors unless you also update every dependent script/test safely
- Preserve login shell behavior
- Preserve stale-session handling that routes legacy/saved users into PIN setup when no active PIN session exists
- Preserve logout behavior that returns cleanly to the login screen and clears session-related local state
- Preserve bottom nav behavior
- Preserve install/app shell behavior
- Preserve current screen activation logic
- Preserve admin mobile paths
- Preserve the current polished visual system across booking/messages/partners/settings/admin
- For `public/mobile-app/index.html`, prefer splitting into partial-like sections/helpers only if safe
- For `public/mobile-app/js/admin.js`, extract helpers carefully but preserve API calls, state mutations, and notification side effects exactly

## Specific File Guidance

### `public/mobile-app/index.html`
- This is high risk
- Do not redesign markup
- Do not rename important IDs/classes without updating all dependent code/tests
- Prefer extracting repeated patterns and improving organization
- If splitting is unsafe in the current setup, do smaller structure-preserving cleanup only
- Keep all working screens reachable
- Keep accessibility attributes intact

### `public/mobile-app/js/admin.js`
- Break into focused helpers/modules if safe
- Separate:
  - announcements
  - court blocks
  - member management
  - shared admin utilities
- Preserve exact API endpoints and payload shapes
- Preserve success/error toasts and side effects
- Preserve announcement audience filtering
- Preserve announcement opt-out checks
- Preserve announcement inbox-message delivery for opted-in recipients
- Preserve court-block cancellation side effects

### `app/dashboard/lib/store.tsx`
- This is business-logic sensitive
- Refactor with extreme care
- Preserve current state shape unless there is a compelling reason not to
- Preserve subscriptions, sync behavior, and auth/session interactions
- Preserve the current upgraded visual hierarchy and shell assumptions used by the dashboard UI
- Extract helper functions/selectors/actions before changing structure
- Do not introduce a new global state library
- Do not rewrite all state management patterns at once

## Decision Rules

If something feels risky:
- reduce scope
- do the smaller safer version
- explain why

If `public/mobile-app/index.html` is too risky for real modularization:
- say so
- do only safe cleanup/extraction around it
- do not force a rewrite

If `app/dashboard/lib/store.tsx` feels too tightly coupled:
- extract helper logic first
- do not replace the state model wholesale

If `admin.js` can be split safely:
- do it
- preserve all API calls, side effects, toasts, and notification behavior

Success criteria:
- easier maintenance
- less duplication
- smaller hotspots
- no launch-critical regressions
- no broad redesign
- no speculative architecture churn
- no regression in announcement delivery preferences/channels
- no regression in court-block cancellation side effects
- no regression in mobile session recovery or logout cleanup

When in doubt:
choose safer over cleaner.
