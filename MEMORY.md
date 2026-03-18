# MEMORY.md — Persistent Context for Claude Code & Cowork

> **Session history moved to `HISTORY.md`** — searchable via `qmd search` or `qmd query`. This file contains only current-state essentials.

---

## Workflow Tools & Gotchas
- **Cowork**: Visual verification (BDG screenshots). **Playwright**: Automated regression. **Both required before saying "done".**
- **Image upload MIME bug**: ALWAYS share screenshots as `.png` — never `.jpg`. Windows screenshots are PNG internally but get `.jpg` extension, causing API 400 errors that kill sessions.
- **Test emails only**: `test@example.com` or `testuser@mtc.ca`. NEVER user's real email. (Rule #25, violated 3+ times.)
- **Test mock rule**: GREP real source for localStorage keys, API endpoints, DOM IDs before writing mocks. Never guess.
- **Code review reports**: `MTC-Code-Review-Report.docx` (38 findings), `MTC-Bug-Hunting-Report.docx` (39 findings) — all resolved.
- **qmd**: Indexed at 288 files. Run `qmd update` as FIRST command every session + after batch file changes. Use `qmd search` before Read/Glob/Grep. MCP config: `~\.claude\mcp.json` (uses bun, not shell wrapper). PowerShell alias in `$PROFILE`.
- **Cowork VM resets every session** — always run these two commands first before anything else:
  1. `export PATH="$HOME/.bun/bin:$PATH" && bun install -g https://github.com/tobi/qmd && cd ~/.bun/install/global/node_modules/@tobilu/qmd && bun install @types/node --no-save && bun run build && cd -` — installs qmd
  2. `qmd update` — syncs index with latest file changes
- **Cowork esbuild**: Run `npm install @esbuild/linux-x64 --no-save` before `npm run build:mobile` in Cowork VM.

## Auth System — PIN-Based (Current)
- Email + 4-digit PIN. No Google OAuth, no magic link, no Supabase Auth, no passwords.
- Signup: name + email (typed twice) + 4-digit PIN. No confirmation email.
- Login: email + PIN. App remembers email in localStorage.
- Forgot PIN: 4-digit code emailed → user types in app → set new PIN. Never leaves app.
- Brute force: 5 wrong attempts → 15 min lockout. Weak PINs rejected (1234, 4321, repeated digits).
- Session: `mtc-session` httpOnly cookie (middleware checks). localStorage: `mtc-session-token` (dashboard), `mtc-access-token` (mobile PWA).
- Auth routes: `/api/auth/pin-login`, `/api/auth/pin-setup`, `/api/auth/forgot-pin`, `/api/auth/verify-code`, `/api/auth/signup`, `/api/auth/session`.
- Kept: `/api/mobile-auth/config/route.ts` (Supabase URL + anon key for Realtime).
- Supabase = database only. RLS disabled. API routes handle access control.
- `profiles` table = member list (not `auth.users`). `gen_random_uuid()` on `id`.
- Resend SMTP for: forgot PIN codes + booking confirmation emails. General comms via Gmail mailing list.

## Apple/Safari Testing
- Playwright WebKit: 5 projects in CI (iPhone SE, iPhone 14, iPad Mini, iPad Pro 11", mobile PWA WebKit).
- Real devices: iPad Mini 5th gen (2019), iPhone SE 2nd gen (2020).
- Tablet CSS starts at `744px` (iPad Mini), iPad Pro 12.9" wider content at `1024px`.
- Always use `-webkit-backdrop-filter` alongside `backdrop-filter`. `dvh` fallback chain: `100%` → `-webkit-fill-available` → `100dvh`.

## Architecture Quick Reference
- **Landing**: `app/(landing)/page.tsx` + components
- **Dashboard**: `app/dashboard/` — 7 split contexts (`useAuth()`, `useBookings()`, `useEvents()`, `useSocial()`, `useNotifications()`, `useFamily()`, `useDerived()`)
- **Mobile PWA**: `public/mobile-app/` — vanilla JS SPA
- **API**: `app/api/mobile/` (shared by both platforms) + `app/api/auth/` (PIN auth)
- **Shared constants**: `app/lib/shared-constants.ts` (LIMITS, BOOKING_RULES, VALID_* enums, validation functions)
- **Notifications helper**: `app/api/lib/notifications.ts` (createNotification), `app/api/lib/push.ts` (sendPushToUser)
- **Dashboard mutations**: ALL go through API (`apiCall()` in store.tsx), not direct Supabase. (Rule #21)
- **Mobile PWA build**: Source in `js/` + `css/` → `npm run build:mobile` → `dist/app.bundle.*`. Never edit dist directly.
- **Deployment**: Railway (NOT Vercel). `npm run build` → `npm start`. NODE_VERSION=20.

## Cross-Platform Sync
- Supabase Realtime on both platforms (8 tables: bookings, booking_participants, partners, messages, conversations, events, event_attendees, notifications).
- Mobile PWA: `realtime-sync.js` with 2-min heartbeat fallback.
- Dashboard: Realtime in store.tsx with 2-min heartbeat.
- DB write on any platform → live updates on all platforms automatically.

## Pre-Commit Checklist
1. Grep all three codebases: `app/dashboard/`, `public/mobile-app/`, `app/api/mobile/`
2. Does this change apply to the other platform?
3. Dashboard mutations through API (Rule #21)
4. Tests added/updated? (Rule #22)
5. Build check: `npx tsc --noEmit` + `npm run build:mobile`
6. **Visual verification in BDG** — mandatory, cannot skip. No screenshot = not done.
7. Update MEMORY.md

## Current Status (as of Mar 18, 2026)
- **Production readiness**: 10/10. All platforms hardened.
- **Test count**: ~1209 tests across 36 files (2 pre-existing CI failures unrelated to recent work).
- **SMTP**: Resend SMTP live (noreply@monotennisclub.com).
- **GSC**: Verified. Sitemap submitted.
- **Coach's Panel**: REMOVED (Mar 16). Lessons tab visible to ALL users.
- **Android splash**: Fixed (split any/maskable icons).
- **DNS**: `www.monotennisclub.com` resolves (Railway CNAME). Root `@` needs A record.

### Codex Refactor — Phase 1+2 (Mar 18, 2026)
**Dashboard store.tsx split** (Phase 1 — safe extraction):
- `store-helpers.ts`: loadJSON, saveJSON, safeArray, mergeEventsWithDefaults, settledValue
- `store-analytics.ts`: computeAnalytics() + MEMBERSHIP_FEES constant
- `store-weather.ts`: parseWeatherData() (Open-Meteo weather code mapping)
- store.tsx imports all three; 0 type errors (`tsc --noEmit` clean)

**Mobile admin.js split** (Phase 2 — controlled modularization):
- `admin.js` (1892 lines) split into 6 IIFE modules:
  - `admin-helpers.js` — MTC.admin namespace, shared state, tab switching, CSV exports
  - `admin-dashboard.js` — dashboard widgets, stats, gate code
  - `admin-members.js` — member CRUD, filtering, messaging
  - `admin-courts.js` — court status, blocks CRUD
  - `admin-announcements.js` — announcements CRUD, coach announcement modal
  - `admin-events.js` — booking modify/cancel, event create, e-transfer, task manager
- Build script updated: LAZY_BUNDLES now lists all 6 files (admin-helpers first)
- `admin.js` renamed to `admin.js.bak` (kept as reference)
- Build verified: `npm run build:mobile` passes, admin bundle = 71.0KB JS
- Cross-IIFE calls work via `window.*` exports and `MTC.admin` shared namespace

**Deferred to Phase 3**:
- `index.html` (2823 lines) — too risky for modularization, per handoff guidance
- Hardening: dead-code sweep, test additions for new modules

## Pending / TODO
- Partner request broadcast push (not yet implemented — users only see new requests when they open Partners screen)
- Profile field unification (Dashboard has avatar/member-since/role-badge; Mobile has availability/play-style prefs — need to pick best of both)
- Calendar too big on iPad + missing quick actions (user hasn't given full details)
- Clean up `nicholas617@10minutes.email` test account from Supabase
- Delete orphaned Alex RSVP: `DELETE FROM event_attendees WHERE user_name = 'Alex';`
- Enable PgBouncer in Supabase (Project Settings → Database → Connection Pooling, Transaction mode) — critical for 40+ concurrent users on opening day
- Disable all Supabase auth providers in dashboard (Google OAuth, email/magic link, signup toggle)

## Color Palettes (Rule #26 — never mix)
- **Landing / Dashboard**: `#1a1f12` bg, `#6b7a3d` olive, `#d4e157` accent, `#e8e4d9` cream, `#faf8f3` card bg
- **Mobile PWA**: `#c8ff00` neon lime, `#ff5a5f` coral, `#00d4ff` cyan, `#0a0a0a` dark
