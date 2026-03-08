# MEMORY.md - Persistent Context for Claude Code

## Workflow Tools
- **Cowork (Claude Desktop)** is available for interactive browser-based visual verification. Use Cowork for subjective visual checks ("does this look right?", hover states, animations, glass morphism rendering, full-page scrollthroughs). Use Claude Code + Playwright for automated regression checks ("did this break?").
- **Code review reports**: `MTC-Code-Review-Report.docx` (38 findings) and `MTC-Bug-Hunting-Report.docx` (39 findings) in project root.
- **⚠️ Image upload MIME bug (Claude Code)**: API throws `400 invalid_request_error` ("image was specified using image/jpeg media type, but appears to be image/png") when a file with `.jpg` extension contains PNG data. This kills the session. **Workaround**: ALWAYS share screenshots as `.png` — never `.jpg`. Windows screenshots (Snipping Tool, Win+Shift+S) are always PNG internally. If pasting from clipboard triggers the error, use `/rewind` immediately. This is a Claude Code bug (MIME detection trusts extension, not actual bytes).
- **User flow testing**: Use BDG (Claude in Chrome) + Guerrilla Mail (guerrillamail.com) to create test accounts and test real user flows (Google login, magic link, signup, booking, etc.) before shipping auth changes. Always verify auth flows end-to-end in the browser — never ship auth changes without testing.
- **Test mock rule**: Before writing/updating E2E test mocks, ALWAYS grep the real source code for the actual localStorage keys, API endpoints, and DOM IDs. Never guess. Past CI failures from wrong mocks: `mtc-current-user` vs `mtc-user`, missing `mtc-onboarding-complete`, asserting on removed `signupPassword` field.

## Pre-Commit Cross-Platform Checklist
Before reporting any feature change as "done", verify:
1. **Grep all three codebases**: `app/dashboard/`, `public/mobile-app/`, `app/api/mobile/`
2. **Does this change apply to the other platform?** (e.g. fix on dashboard → does mobile have the same bug?)
3. **Dashboard mutations go through API** — check store.tsx uses `apiCall()`, NOT `db.*` for writes (CLAUDE.md #21)
4. **Tests**: Did you add/update a test? (CLAUDE.md #22) If not, note what test is needed.
5. **Build check**: `npx tsc --noEmit` + `npm run build:mobile` both pass
6. **MEMORY.md updated** with what changed and what's still pending

## Current Status
- **SMTP/Supabase email**: DONE. Resend SMTP (smtp.resend.com:465, noreply@monotennisclub.com). Email confirmation and password reset emails are live.
- **Deployment**: Railway (NOT Vercel). NODE_VERSION=20 env var set. 13 env vars total.
- **Google OAuth**: LIVE. Users log in with Google on both Dashboard and Mobile PWA.
- **GSC**: Verified (HTML file method). Sitemap (`/sitemap.xml`) already submitted. No meta tag needed.
- **Booking emails**: Fixed `from` address bug. Now uses `SMTP_FROM=noreply@monotennisclub.com`. Domain verified on Resend.
- **Message notifications**: Bell + push notifications trigger on message send. `/api/notify-message` route for push.
- **Cross-platform push notifications**: Added push+bell to conversations POST, events PATCH/DELETE, announcements POST.
- **Mobile PWA home calendar**: Replaced "Looking for Partners" with club calendar (neumorphic month grid). Source: `home-calendar.js`.
- **Login screen**: Email Link button electric-blue/cyan. Phone+tablet mockups show club calendar. 2/3 mockup + 1/3 form layout.
- **Desktop login redirect**: `signInWithGoogle('/dashboard')` and `signInWithMagicLink(email, '/dashboard')` pass `?next=/dashboard` through OAuth/magic link flow.
- **Production Readiness**: 10/10. All platforms hardened. Zero remaining findings from code review reports.
- **API route consolidation (Mar 8)**: All Dashboard mutations in store.tsx now route through API endpoints instead of direct Supabase. Added `apiCall()` helper. Eliminates RLS policy gaps. Remaining `db.*` calls: fetches (SELECT, safe), `createNotification` (INSERT policy exists), programs CRUD (admin-only, safe). `confirmParticipant` now routes through API (DONE).
- **confirmParticipant API enhancement (Mar 8)**: Bookings PATCH endpoint now supports both self-confirm (`{ bookingId }`) and confirming other participants (`{ bookingId, participantId, via }`). When confirming others, caller must be booking owner or admin (403 otherwise). Dashboard store.tsx rerouted from direct `db.confirmParticipant()` to `apiCall('/api/mobile/bookings', 'PATCH', ...)` with rollback on failure.
- **Booking calendar restyled (Mar 8)**: Today = electric blue (was volt), selected = liquid glass with blur+border+lift (was flat black). Cancellation reminder added to booking modal.
- **CLAUDE.md rules added**: #21 (Dashboard mutations through API), #22 (tests for major changes). Cross-platform checklist added to MEMORY.md.
- **Shared constants centralized (Mar 8)**: Created `app/lib/shared-constants.ts` — single source of truth for LIMITS, BOOKING_RULES, all VALID_* enums, SETTINGS_KEY_WHITELIST, and isomorphic validation functions (isValidUUID, isValidEnum, isValidDate, isInRange, isValidEmail, isValidTime, sanitizeInput). `auth-helper.ts` now re-exports from shared-constants (no more duplicate definitions). Zero TypeScript errors.
- **Integration tests added (Mar 8)**: 8 new test files (203 tests): `api-bookings.test.js`, `api-conversations.test.js`, `api-partners.test.js`, `api-events.test.js`, `api-notifications.test.js`, `api-members.test.js`, `shared-constants.test.js`, `cross-platform-sync.test.js`. Tests verify: route structure, validation rules match shared constants, cross-platform consistency (Dashboard→API, Mobile→API), auth enforcement, Supabase Realtime subscription parity, notification layer completeness, no duplicate definitions in auth-helper.
- **Fuzz tests added (Mar 8)**: 3 files (147 tests): `fuzz-validation.test.js` (direct-import chaos testing of all 7 validation functions — XSS, SQL injection, Unicode, null bytes, 100k strings, ReDoS), `fuzz-api-routes.test.js` (source inspection of all 13 API routes for input guards), `fuzz-mobile-pwa.test.js` (function extraction + fuzz testing of mobile PWA sanitizers, parsers, error handlers). Known gaps documented: JS Date rolls Feb 30, isValidTime is format-only, single quotes in emails are RFC-valid.
- **Feature regression tests added (Mar 8)**: `feature-regression.test.js` (125 tests) covering all 12 API-backed features: Court Booking, Messaging, Partner Matching, Events & RSVP, Notifications, Member Profiles, Announcements, Court Management, Settings, Programs, Families, Lineups. Each feature tested for: complete CRUD flow, validation, Dashboard integration, notification layers, validation constant values.
- **Bug-specific regression tests (Mar 8)**: `regression.test.js` (43 tests) for known fixed bugs (silent Supabase writes, RLS bypass, duplicate constants, missing columns, demo data leak, XSS, SW caching, rate limiting, coaching panel).
- **Total test count (Mar 8)**: **747 tests across 27 files**, all passing.
- **Coaching panel access (Mar 8)**: Sidebar now shows "Book Lessons" link for both coaches AND admins (was coach-only). Sidebar.tsx line 145: `(isCoach || isAdmin)`.
- **Coaching program bookings**: `db.createBooking` is still used in the coaching program creation flow (line 966 of store.tsx). This is coach-only (coaching panel), not admin. Coaches create program bookings (type: 'program') via the coaching panel.

---

## Archived Sessions (March 1-4, 2026) — Compressed Summary

All items below are COMPLETED. Kept for reference only.

**Core Infrastructure (Mar 1-3):**
- 12 bug fixes across 11 files (MutationObserver debounce, race conditions, timing-safe auth, session expiry, cache fallback)
- Security hardening: rate limiting on all API routes, input sanitization (XSS strip), event delegation for onclick handlers, offline auth requires valid Supabase token (no weak hash)
- Supabase silent error fix: added `if (error) throw error;` to ALL 26+ write functions in `db.ts` (INSERTs/UPDATEs were failing silently)
- Missing columns fixed: `bookings.match_type`, `bookings.duration`, `profiles.status`, `partners.skill_level`, `partners.message`
- Demo/fake data fully removed from all 3 platforms (dashboard, mobile PWA, landing)
- Google OAuth + Magic Link (passwordless) auth implemented across dashboard + mobile PWA
- Password removed from signup flow (Supabase gets random UUID password internally)
- Auth callback handles email confirmation, password reset (hash fragment detection), and new user welcome flow
- FK cascade: ON DELETE CASCADE added to 12 FK constraints, `delete_member` RPC rewritten
- Mobile API: 8+ new endpoints (events, bookings, members, partners, announcements, conversations, courts, notifications, families, programs, settings, lineups, court-blocks)
- Mobile PWA fully wired to Supabase: ALL localStorage-only operations now persist server-side
- All admin functions (mobile) wired to real API (create event, add member, announcements, tasks, e-transfer, CSV exports, court blocking)
- Booking confirmation + cancellation emails (cream theme, ICS calendar invites, multi-recipient)
- Booking attendance confirmation tracking (email click, dashboard button, mobile future)
- Email logs audit table (`email_logs`) tracking ALL outbound communications
- Push notifications: VAPID keys, `push_subscriptions` table, Web Push on both platforms
- Onboarding tour (5-step tooltip), activity feed, member directory, quick-book from calendar
- Family membership (Netflix-style profiles): `families`/`family_members` tables, profile switcher on both platforms
- Skill level at signup (new step in wizard), interclub team assignment, captain team management
- Admin analytics computed from real data (bookings, members, programs), CSV exports with date filter
- Supabase Realtime expanded to 11 tables on dashboard, courts fetched from DB
- Mobile PWA: offline queue persistence, offline mode indicator, pull-to-refresh, crash recovery overlay
- Error reporting pipeline: client-side batching → `/api/errors` → `error_logs` table
- Accessibility: skip links, ARIA landmarks, gallery alt text, keyboard nav, form label linking
- CI: npm audit, tsc, build, unit tests, Playwright E2E, PR check workflow
- 229 unit tests + 47 E2E tests all passing
- DB migration tooling (Supabase CLI) + DIY backup system (`scripts/backup-db.sh`)
- Console cleanup: 51 `console.warn/log` → debug-gated `MTC.warn/MTC.log` in mobile PWA
- Time slots: 9:30 AM start, 24h→12h format fixed across all platforms
- `email_sent_at` on bookings, `confirmed_at`/`confirmed_via` on booking_participants, `opened_at` on email_logs

**Supabase SQL all applied (Mar 3-4):** seed data, RLS on all 18+ tables, security advisory fixes (SET search_path), email templates, push_subscriptions, error_logs, families, family_members, match_lineups, lineup_entries, interclub_team/captain on profiles, audience on announcements, court_blocks.

---

### Cowork Session (2026-03-05) — Mobile PWA Booking Improvements

**Booking grid enhancements (all in mobile PWA):**
- **Now-line**: Red `::before` line on current time slot row using `var(--coral)` theme color, with time cell highlighted in coral bold
- **Past-hours dimming**: Slots before current time on today show `—` dash and `.past` class
- **Smart scroll**: Auto-scrolls to now-row on page load
- **Court hours labels**: Shows "Lit til 10 PM" / "til 8 PM" under court headers
- **Prime time glow**: Subtle background on peak hours (weekends 9:30am-12pm, weekdays 6pm-9pm)
- **Active tap state**: `:active` scale animation on BOOK buttons
- **Booking info panel**: Collapsible accordion below legend with guest fee, cancel window, durations, advance booking days, court hours, cancel reminder

**Bugs fixed:**
- **Duplicate `timeToMinutes` function**: Second definition (24h-only) at line 234 overwrote first (12h+24h) at line 149. Caused ALL PM times to parse as AM. Fixed by removing duplicate.
- **Grid layout collapse**: `#screen-book { overflow: hidden }` with rigid flex layout left only ~72px for grid body. Fixed by changing to `overflow-y: auto` scrollable layout.
- **Season gate**: Added date check to skip recurring programs before Opening Day (May 9, 2026)

**Files modified:** `booking.js`, `home.css`, `index.html`

### Cowork Session (2026-03-05/06) — Dashboard Booking View Restructure

**View restructure:**
- Removed "All Courts" toggle — Week and Month views both show all 4 courts as columns
- Week view: day tabs + all 4 courts grid + event banners above grid
- Calendar view: month grid + event detail cards + all 4 courts grid when date selected

**Event slot filling:** Events with parseable times fill corresponding time slots on their courts. Event type-specific colors matching landing page (social=amber, match=purple, tournament=dark, camp=red, lesson=blue).

**Now-line (current time indicator):** coral red line across current time slot in week view, updates every 60s.

**Data fixes:** Freedom 55 + Interclub → "All Courts" (all platforms).

**Files:** `book/page.tsx`, `BookingLegend.tsx`, `booking-utils.ts`, `data.ts`, `events.ts`, `seed.sql`, `booking.js`

### Cowork Session (2026-03-05) — UI Polish + Demo Data Cleanup

- Removed 5 hardcoded fake conversation items + 3 fake notifications from `index.html`
- Dynamic `renderConversationsList()` in `messaging.js`
- Menu drawer footer redesign (weather card)
- Dashboard sidebar hover animation (glow slide-in, icon lift, text nudge) — removed all inline styles
- Quick action card hover lift (Tailwind classes)
- Court light icon: emoji → SVG lightbulb (amber stroke)

### Cowork Session (2026-03-06) — Cross-Platform Realtime Sync Architecture

**Problem:** Mobile PWA had ZERO realtime subscriptions — entirely pull-based.

**Solution — `realtime-sync.js` (NEW, 301 lines):**
- Subscribes to 8 tables (bookings, booking_participants, partners, messages, conversations, events, event_attendees, notifications)
- Debounced refetch (1.5s), heartbeat sync every 2 min, visibility change + online handlers
- PUSH_RECEIVED SW message handler: auto-fetches on push arrival
- Stale data indicator CSS (green dot = fresh, red pulse = stale)

**Also in session:** Push on booking create/cancel, push on partner match, pull-to-refresh calls refetchAll(), API client queue badge, CI test fixes (13→0 failures), login mockup updates, avatar picker 4-column grid, onboarding install instructions (device-specific).

**Cross-platform sync matrix (AFTER):** All 4 combos (Dashboard↔Mobile) now near-instant via Realtime ✓

### Cowork Session (2026-03-06) — Auth Flow Testing, Booking Email, Notification Parity

- Full auth cycle tested on live site (signup → confirm → login → reset)
- Password reset hash fragment detection fix
- FK cascade fix (12 FK constraints + delete_member RPC rewrite)
- Booking email `from` address bug fixed (SMTP_FROM env var)
- Home calendar on mobile PWA
- Cross-platform push on conversations, events, announcements
- Login screen restyled (electric-blue magic link button)
- Railway build fix (Next.js 16 Turbopack → `--webpack` flag)
- Mobile PWA messaging unread tracking fixed
- Notification/sync audit: Rule #20 added to CLAUDE.md

### Messaging & Notification Infrastructure Upgrade (Cowork Session — Mar 7 2026)
**Shared push utility:** `app/api/lib/push.ts` — single `sendPushToUser()` used by all 6 mobile API routes + `/api/notify-push`. Preference enforcement + expired sub cleanup.

**Push triggers in Dashboard store:** addBooking, cancelBooking, enrollInProgram → push to affected users.

**Mobile PWA notification center fixed:** Added `.notifications-list` container, count badge, type-specific SVG icons.

**Dashboard Realtime heartbeat:** 2-min fallback polling for notifications, conversations, bookings.

**SEO:** JSON-LD sameAs, font-display:swap, SSR for Schedule/Partners, hero preload, BreadcrumbList schema, logo optimization.

**Read receipts (Phase 6):** Single/double checkmark on sent messages (both platforms). Driven by `msg.read`.

**Desktop push (Phase 7):** `public/sw.js` push+notificationclick handlers. `DashboardHeader.tsx` subscribes on login.

**Generic email endpoint (Phase 8):** `/api/notify-email/route.ts` — JWT auth, 20/hr rate limit, cream-themed HTML. Wired into addPartner + enrollInProgram.

### Cowork Session (2026-03-07) — Notification Parity (10/10 Cross-Platform)
Closed ALL notification asymmetries. Every action fires symmetric bell + push + email on both platforms.

10 changes across store.tsx, partners/route.ts, programs/route.ts:
- Partner create: bell + push + email (both platforms)
- Partner match: bell + push + email to poster AND bell + push to joiner
- RSVP: bell + push
- Program enroll: bell + push + email + coach welcome message
- Program withdraw: bell + push + coach message
- Partner remove (if matched): bell + push to matched person

### Cowork Session (2026-03-07) — Login Mockup + Google OAuth Redirect Fix

- Login mockup calendar (March 2026 grid replacing old "Looking for Partners")
- Phase 6-8 code verified (read-only audit — all confirmed complete)
- Google OAuth redirect fix (mobile PWA): Added `{ auth: { flowType: 'pkce' } }` to Supabase client
- Full OAuth flow documented (auth.js → Google → callback → auth/complete → mobile app)
- CI test fixes: auth selectors updated for Google+Magic Link flow
- Login resilience: retry logic, local Supabase fallback, better error UX
- Fake announcements removed from data.ts
- Tablet nag banner (SessionStorage, returns every session)
- New-user + existing-user welcome notifications
- Password removed from signup (passwordless only)
- Desktop admin tab restyling (SVG icons, bolder tabs, larger touch targets)

### Cowork Session (2026-03-07) — Mobile Admin Parity, Court Blocking, Login Fixes

**Google login first-click fix:** Eager `initSupabase()` on DOMContentLoaded. Buttons disabled until ready.

**Mobile admin panel — full feature parity with desktop:**
- 4-tab admin: Dashboard | Members | Courts | Announcements
- Dashboard: analytics cards, gate code management, CSV exports, peak times, court usage
- Members: searchable roster, role/team badges, captain toggle, add/remove
- Courts: status toggle + court blocking
- Announcements: create with type+audience, history with delete

**Court blocking system:**
- `court_blocks` table, API route (GET/POST/DELETE), admin UI modal
- Booking validation checks blocks before allowing
- Blocked slots visual on BOTH booking calendars (red striped bg + reason)
- Realtime subscriptions on both platforms

### Cowork Session (2026-03-07) — Hero Video, Opening Day Card

- Hero section: looping video background (`hero-clubhouse.mp4`, 4.8MB)
- LOGIN navbar button: frosted glass white (visible against video)
- Opening Day card: frosted glass on right side of hero ("Opening Day / May 9 / BBQ & Meet the Pro's")
- About section: "Clubhouse" → "Modern Washrooms", logo → Clubhouse-Inside.png

### Cowork Session (2026-03-08) — Mobile PWA Messaging, Partners, Emoji Cleanup

**Messaging race condition fix (critical):**
- Root cause: `clubMembers` and `conversations` loaded in parallel. If conversations arrived first, member name lookups failed (showed UUID).
- Fix: `conversationMetaMap` fallback + serialized load order (members first, then conversations).
- Files: `messaging.js`, `auth.js`

**Welcome message template updated:**
- New users see "Your court gate code will be provided after Opening Day" instead of raw gate code.
- Files: `supabase/schema.sql`, migration `20260307_welcome_message_no_gate_code.sql`
- **Needs:** Run migration on production Supabase (`npm run db:push` or run SQL manually).

**Tennis emoji cleanup (rule #18 — 8 violations fixed):**
- All `🎾` instances replaced in `booking.js` (6) and `events-registration.js` (1).
- "MY COURT" labels use SVG circle icon. Push notifications use checkmark.

**Partners screen — full list rendering (was broken):**
- Added `#partnerCardsContainer` div. New `renderPartnersScreen()` function in `navigation.js`.
- Fixed `insertPartnerRequestCard()` target container.
- Files: `index.html`, `navigation.js`, `partners.js`, `partners.css`

**Swipe-to-delete on conversations (new feature):**
- Touch-based swipe left reveals red "Delete" action. 80px threshold reveals, 140px auto-deletes.
- Client-side only (no API DELETE endpoint). Conversations reappear after re-login.
- Files: `messaging.js`, `messaging.css`

**Booking page fixes (mobile PWA):**
- Day tabs vertical lime bars: Fixed `switchBookingView('week')` from `display: flex` to `display: block`.
- Auto-scroll to current time: Changed scroll target to `#screen-book` container.
- Files: `booking.js`

**Booking confirmation modal cleanup:**
- Removed Court Fee bar + FREE FOR MEMBERS section.
- Single guest fee note: "Bringing a guest? A $10 guest fee applies per non-member."
- Files: `index.html`, `booking.js`

**24hr cancellation restriction removed (cross-platform):**
- Users can cancel bookings anytime before slot starts.
- Files: `bookings/route.ts`, `booking-utils.ts`, `book/page.tsx`, `BookingSidebar.tsx`, `schedule/page.tsx`

**FAQ "Still have questions?" email section:**
- Added below FAQ accordion, links to monotennisclub1@gmail.com.
- Files: `FAQTab.tsx`

**Court blocking date range support:**
- Admin modal: Start Date + End Date. Creates blocks in parallel.
- Files: `admin.js`

**Court blocking UI on desktop admin panel:**
- `AdminCourtsTab.tsx` expanded: court status + block form + upcoming blocks list.

**Three production bugs found & fixed (live site testing):**
1. clubMembers not populating (CRITICAL): `loadFromAPI()` type validation rejected arrays when fallback was null. Fixed: skip validation when `fallback === null`.
2. Partners header scrolled off-screen: `navigateTo()` didn't reset `#app` container scroll. Fixed.
3. New Message modal click not working: `stopPropagation()` on modal blocked event delegation. Fixed with local click handler on `#memberSearchResults`.

**Build:** Mobile PWA build passes (29 JS → 327KB, 23 CSS → 213KB, cache: mtc-court-8c67a014). TypeScript clean.

**Still needs:**
- Run welcome message migration on production Supabase
- Deploy to Railway to verify admin panels and bug fixes in production

### Cowork Session (2026-03-08b) — Messaging 10/10 Overhaul

**Sent messages showing as unread (mobile PWA):** Messages sent on mobile had no `read` field, causing single-check (unread) display. Fixed: now sets `read: true` + `timestamp` on optimistic message push. Dashboard already did this correctly.

**Conversation list sort (mobile PWA):** Was sorting only by "has messages" (empty last). Now sorts by actual last message timestamp, most recent first.

**Server-side message + conversation deletion (NEW — cross-platform):**
- Added `DELETE` handler to `/api/mobile/conversations/route.ts`: supports `{ conversationId }` (whole conversation, FK cascades messages) and `{ messageId }` (single message, sender-only). Auth checks: must be participant for conversation, must be sender for message.
- **Mobile PWA**: Swipe-to-delete now calls DELETE API (was local-only — conversations came back on re-login). Long-press on sent message shows delete confirmation modal with haptic feedback, deletes server-side.
- **Dashboard**: Hover trash icon on conversation list items. Hover trash icon on sent messages in chat. Both call new `deleteConversation()`/`deleteMessage()` store functions with optimistic UI + rollback on failure.

**Dashboard member search (New Message):** Clicking "New" now shows all members immediately (was: required typing a query first). Members with existing conversations show "existing" badge. Removed filter that hid members with existing conversations.

**Files changed:**
- `public/mobile-app/js/messaging.js` (558→643 lines) — read field, timestamp, sort, server delete, long-press delete
- `app/api/mobile/conversations/route.ts` (247→322 lines) — DELETE handler
- `app/dashboard/messages/page.tsx` (395→416 lines) — delete buttons, member list always visible
- `app/dashboard/lib/store.tsx` — `deleteConversation()`, `deleteMessage()` functions + context exports

**Build:** 29 JS → 329KB, 23 CSS → 213KB, cache: mtc-court-c25e9387. TypeScript clean.

### Cowork Session (2026-03-08c) — Court Blocking Auto-Cancel + Bulk Delete

**Auto-cancel conflicting bookings (NEW):**
- When admin creates a court block, `cancelConflictingBookings()` automatically finds and cancels all confirmed bookings that overlap with the block (by date, court, and time range).
- Each affected user receives: bell notification ("Booking cancelled — court blocked") + push notification with details.
- POST response now includes `cancelledBookings` count and `cancelledDetails` array.

**Bulk delete court blocks (NEW):**
- DELETE endpoint now supports 3 modes: `?id=...` (single), `{ ids: [...] }` (bulk by IDs), `{ from, to, courtId }` (range delete by dates + optional court filter).
- Dashboard: "Clear All" button on blocks list, calls bulk DELETE with all block IDs.
- Mobile PWA: "Clear All" button in `renderBlocksList()`, same bulk DELETE API call.

**Dashboard time format fix:**
- `AdminCourtsTab.tsx` was sending 24h "08:00" but API/DB uses 12h "9:30 AM". Added `to12h()` converter.
- Block creation now goes through API route (not direct Supabase insert) so auto-cancel triggers.

**Files changed:**
- `app/api/mobile/court-blocks/route.ts` (78→228 lines) — `parseTimeMinutes()`, `cancelConflictingBookings()`, bulk DELETE
- `app/dashboard/admin/components/AdminCourtsTab.tsx` (373→425 lines) — API route, to12h(), bulk delete, Clear All
- `public/mobile-app/js/admin.js` — cancelled count toast, `clearAllCourtBlocks()`, Clear All button

**Build:** 29 JS → 329KB, 23 CSS → 213KB, cache: mtc-court-0dbe4763. TypeScript clean.

### Cowork Session (2026-03-08d) — Messaging UX Enhancements (Cross-Platform)

**Swipe-to-delete on individual messages (mobile PWA):**
- Sent messages wrapped in `.msg-swipe-container` with swipe-left-to-delete gesture
- Same UX pattern as conversation list swipe (60px reveal, 120px auto-delete)
- First-time swipe hint: "Swipe left on your messages to delete" (localStorage flag)

**Typing indicator (cross-platform, Supabase Realtime broadcast):**
- Both platforms join `typing-indicators` broadcast channel (ephemeral, no DB writes)
- Sender broadcasts `{ fromId, toId }` throttled to max once per 2s
- Receiver shows animated bouncing dots for 3s after last event
- Mobile: `MTC.fn.startTypingIndicator()` called after login in `auth.js`
- Dashboard: useEffect in messages page, separate channel from main Realtime

**Reply-to-quote (cross-platform):**
- Format: `[reply:Name:quoted text]\nactual message` stored in message text
- Dashboard: hover reply icon on any message, reply preview bar above input, quoted block in bubble
- Mobile: long-press received message to set reply context, reply bar above chat input
- Both platforms parse and render quoted blocks with left-border accent

**Tap-to-show-timestamp (mobile PWA):**
- Messages store full `timestamp` from API (ISO string)
- Tap any message bubble → tooltip shows "Mar 8, 2:30 PM" for 3s
- Dashboard: hover timestamp toggles between time and full date

**E2E test fix:**
- `mobile-pwa-flows.spec.js:157` settings navigation test was flaky (fixed timeout race condition)
- Changed from `waitForTimeout(1000)` → `expect(locator).toBeAttached({ timeout: 5000 })` (auto-retry)

**Files changed:**
- `public/mobile-app/js/messaging.js` — swipe-to-delete messages, typing indicator, reply-to-quote, timestamp
- `public/mobile-app/css/messaging.css` — typing indicator, reply bar, quote bubble, timestamp tooltip styles
- `public/mobile-app/js/auth.js` — `startTypingIndicator()` call after login
- `app/dashboard/messages/page.tsx` — typing indicator, reply-to UI, hover timestamp, reply icon
- `tests/mobile-pwa-flows.spec.js` — flaky settings test fix

**Build:** 29 JS → 336KB, 23 CSS → 215KB, cache: mtc-court-74c66c4f. TypeScript clean.

### Cowork Session (2026-03-08e) — Cross-Platform UX Audit (9 Features)

**#4: Remove booking participant names from all platforms:**
- Desktop: tooltip on booked slots now shows "Booked" instead of `booked?.userName`
- Desktop: BookingSidebar removed guest name + participants display (kept matchType label)
- Desktop: SuccessModal removed "With: [participant names]" display
- Mobile: booking grid shows "Booked" instead of member names for other people's bookings
- RSVP attendee names for events remain visible (unchanged)

**#1-3: Mobile booking modal enhancements:**
- Match type toggle (Singles/Doubles) — defaults to Singles, affects max duration and participants
- Guest tracking: toggle + name input + $10 fee note (sends `isGuest`, `guestName` to API)
- Player picker: bottom sheet with member search, add/remove chips, respects singles (1) vs doubles (3) max
- `confirmBooking()` now sends `matchType`, `duration`, `isGuest`, `guestName`, `participants` to API
- Booking options reset on modal close

**#5: Partner "Message Opponent" pre-fills recipient:**
- Match detail modal reads `data-partner-id` from partner card
- Button now calls `startConversation(partnerId)` which opens conversation directly with that user
- Falls back to generic `navigateTo('messages')` if no ID available

**#6-8: Mobile events enhancements:**
- Filter tabs: All / Social (free) / Weekly (members) / Tournaments (paid) — pill-style buttons above event list
- `filterEvents()` hides/shows cards + section headers based on badge type
- Spots remaining: `updateEventCardSpots()` injects badge into event card footers
- Paid events: "X/Y spots" or "FULL" (red); Free/members: "X going"
- Low spots (<= 5): coral warning badge
- Spots refresh after API data loads

**#9: Notification preferences UI:**
- Added "Messages" toggle (index 3) and "Event Reminders" toggle (index 4)
- `saveSettingsToggles()` now syncs all 5 notification categories to Supabase API
- `restoreSettingsToggles()` updated for new toggle ordering
- Removed "Location Services" toggle (was never approved, snuck in from a previous session)

**Cleanup:**
- Removed Location Services toggle from settings (was added without approval)
- Fixed booking modal HTML button: `confirmBookingPayment()` → `confirmBooking()` (function didn't exist)
- Removed tennis emoji from partners.js match detail modal

**Files changed:**
- `public/mobile-app/js/booking.js` (1067→1184 lines) — match type, guest, participants, player picker
- `public/mobile-app/js/events.js` (752→843 lines) — filter tabs, spots remaining
- `public/mobile-app/js/partners.js` (526→529 lines) — message pre-fill, emoji removal
- `public/mobile-app/js/notifications.js` — toggle indices updated for Messages + Event Reminders
- `public/mobile-app/index.html` — booking modal options, filter tabs, notification toggles, Location Services removed
- `public/mobile-app/css/home.css` — booking modal option styles (match type, guest, player picker)
- `public/mobile-app/css/schedule.css` — event filter tabs, spots badge styles
- `app/dashboard/book/page.tsx` — tooltip "Booked" instead of userName
- `app/dashboard/book/components/BookingSidebar.tsx` — removed guest/participant names, kept matchType
- `app/dashboard/book/components/SuccessModal.tsx` — removed participant names display

**Build:** 29 JS → 343KB, 23 CSS → 220KB, cache: mtc-court-5dbc14e8. TypeScript clean.

### Cowork Session (2026-03-08f) — Cross-Platform UX Batch (17 Items)

**Completed items from user-approved UX improvement list:**

**#10 Attendee avatars on events:** Replaced plain text `<span class="reg-member">` with colored initial circles (matching dashboard style). Shows up to 8 avatars + "+N more" overflow. "You" highlighted with volt ring. Files: `booking.js`, `home.css`.

**#12 Partner request auto-expiration:** Filter at query level where `date >= today`. Applied on mobile API (`partners/route.ts` `.gte('date', today)`), dashboard (`db.ts`), and mobile localStorage cleanup (`partners.js`).

**#14 Message search within conversations:** In-thread search that dims non-matching messages (opacity 0.2). Dashboard: React state `msgSearchQuery`/`msgSearchOpen`. Mobile: `toggleConvoSearch()`/`filterChatMessages()` in `messaging.js`. CSS in `chat.css`.

**#22 Booking participant confirmation:** Uses existing `confirmed_at`/`confirmed_via` columns. Dashboard: pending confirmations card on home + green/yellow status in BookingSidebar. Mobile: PATCH endpoint + `confirmBookingParticipation()` in `mybookings.js`. Updated `types.ts`, `db.ts`, `store.tsx`.

**#18 Skeleton loaders:** Added events + notifications screen skeletons in `enhancements.js`.

**#20 Badge counters on nav tabs:** Schedule badge (today's bookings) in `booking.js`, partners badge (available count) in `navigation.js`. HTML badges in `index.html`.

**#11 Family profile switching full UI:** Mobile now has full family management UI: member cards, add button, add modal (name/type/birth year). Functions: `renderFamilyMembers()`, `addFamilyMember()`, `removeFamilyMember()` in `profile.js`. CSS in `profile.css`. Creates family via API if needed first.

**Tennis emoji cleanup:** Removed from `avatar.js` toast (rule #18).

**#17 Mobile admin panel — final parity with desktop:**
- Revenue breakdown (stacked bar + legend by membership type)
- Member activity (new members this month, avg bookings/member, top 5 most active)
- Monthly trends (6-month bar chart)
- Date filter on CSV exports (Members/Payments/Court Usage now filter by "from date")
- All 3 render functions added to `admin.js`, called from `loadAdminDashboard()`
- CSS for all new sections in `admin.css`

**Build:** 29 JS → 357KB, 23 CSS → 225KB, cache: mtc-court-cc0bf142. TypeScript clean.

---

### Environment Limitations (IMPORTANT)
- **Cowork VM has NO Playwright browsers installed.** Never attempt E2E tests in Cowork.
- **If a command fails once, diagnose and explain — don't retry.**
- **Unit tests (Vitest) DO work in Cowork** — `npm run test:unit` is safe.
- **`npm run check`** (tsc + mobile build) works in Cowork.

### Cowork Session (2026-03-08g) — Login Dark Mode Mockup + Server-Side Validation Audit

**Login page phone mockup → dark mode:**
- Converted phone device mockup to dark mode while keeping tablet in light mode
- Screen bg: `#f5f2eb` → `#0d1208`, Dynamic Island: `#1a1f12` → `#000`
- Theme toggle: moon highlighted with purple glow (`#a78bfa`), sun dimmed
- Header buttons: neumorphic light → dark glass (`rgba(255,255,255,0.08)`)
- Title/labels: `#1a1f12` → `#e8e4d9`, event cards/calendar/nav → dark glass surfaces
- Accent colors (volt/coral/cyan) unchanged for pop against dark background
- File: `app/login/page.tsx`

**Comprehensive server-side validation audit — 8 fixes across 7 files:**

1. **Partners POST** (`partners/route.ts`): Added `sanitizeInput`/`isValidEnum` imports, validate `skillLevel` against `VALID_SKILL_LEVELS`, sanitize `availability` (200 chars) and `message` (500 chars)
2. **Conversations PATCH** (`conversations/route.ts`): Added participant check — verifies user is `member_a` or `member_b` before allowing mark-read
3. **Conversations POST** (`conversations/route.ts`): Added self-messaging prevention (`toId === authResult.id` → 400)
4. **Announcements POST** (`announcements/route.ts`): Added type enum validation using `VALID_ANNOUNCEMENT_TYPES`
5. **Dashboard bookings POST** (`dashboard/bookings/route.ts`): Removed client-controlled `body.id` — always server-generates booking ID (prevents ID injection)
6. **Notify-message** (`notify-message/route.ts`): Added UUID regex validation on `recipientId`, sanitized `senderName` and `preview` (strip HTML)
7. **Lineups POST** (`lineups/route.ts`): Added `isValidDate` check on `matchDate`
8. **Lineups PATCH** (`lineups/route.ts`): Added `isValidUUID` check on `memberId`

**Routes audited and found clean (no changes needed):**
- `mobile/bookings/route.ts` (581 lines) — already very thorough
- `mobile/notifications/route.ts` (71 lines) — simple GET/PATCH, fine
- `mobile/courts/route.ts` (56 lines) — simple GET, fine
- `mobile/programs/route.ts` (227 lines) — mostly good
- `mobile-booking/route.ts` — deprecated stub (410)

**Build:** 29 JS → 357KB, 23 CSS → 225KB, cache: mtc-court-cc0bf142. TypeScript clean.

### Cowork Session (2026-03-08h) — Cross-Platform Messaging/Booking/Partners Bug Audit

**CRITICAL BUG FOUND — Dashboard message deletion silently failing:**
- Root cause: `conversations` and `messages` tables have RLS enabled but NO delete policies
- Dashboard `deleteConversation()` and `deleteMessage()` in `store.tsx` used direct Supabase client (subject to RLS)
- Supabase returns 200 OK but deletes 0 rows → optimistic UI removes item, but it reappears on refresh
- Mobile PWA was NOT affected (uses API route with admin client that bypasses RLS)

**Fix (dual approach):**
1. **Rerouted dashboard deletes through API** — `deleteConversation()` and `deleteMessage()` in `store.tsx` now call `/api/mobile/conversations` DELETE endpoint (which uses `getAdminClient()`) instead of direct Supabase. Proper rollback on failure.
2. **Added RLS delete policies** — Migration `20260308_add_delete_policies.sql` + schema.sql updated:
   - `conversations_delete_own`: participants (member_a or member_b) can delete
   - `messages_delete_own`: senders (from_id) can delete their own messages

**Other fixes:**
- Removed stale `body.id` from dashboard booking POST request (server already ignores it since previous session)
- Notification badges already present on both login mockups (phone: 3, tablet: 2) — confirmed in code

**Full cross-platform audit results:**
- **Booking**: Both platforms fully wired. Mobile → API → Supabase (admin). Dashboard → API → Supabase (admin). Conflict detection, court block checking, participant notifications, emails all working on both.
- **Messaging**: Both platforms fully wired. Send, receive, read receipts, typing indicator, reply-to-quote, search, delete all working. Dashboard delete was the one broken piece (now fixed).
- **Partners**: Both platforms wired. Mobile: POST/PATCH/DELETE via API. Dashboard: creates via direct Supabase (no RLS on partners table), removes via direct Supabase. Join/match only on mobile (dashboard shows "Message" link instead). All notification flows (bell + push + email) symmetric.

**Files changed:**
- `app/dashboard/lib/store.tsx` — `deleteConversation()`, `deleteMessage()` rerouted through API; removed `body.id` from booking POST
- `supabase/schema.sql` — Added delete policies for conversations + messages
- `supabase/migrations/20260308_add_delete_policies.sql` — New migration

**Build:** TypeScript clean. Mobile PWA: 29 JS → 357KB, 23 CSS → 225KB, cache: mtc-court-cc0bf142.

### Cowork Session (2026-03-08i) — Desktop Mockup Glassmorphism + Quick RSVP

**Login page desktop mockup — glassmorphism overhaul:**
- Added player silhouette background (`/tennis-silhouette-1.png`) at 35% opacity with sepia/hue-rotate filter — matches real dashboard
- Header bar now uses `backdrop-filter: blur(12px)` with semi-transparent bg
- Quick action cards: increased blur to 12px, stronger border (`rgba(255,255,255,0.35)`)
- Booking + Events glass cards: `rgba(255,255,255,0.55)` bg with `backdrop-filter: blur(16px)` and subtle shadow
- Inner cards: `rgba(255,255,255,0.7)` with matching glass borders
- Added RSVP buttons to event cards in mockup (green pill, matches real dashboard style)
- File: `app/login/page.tsx`

**Dashboard home — quick RSVP on Upcoming Events:**
- Added RSVP/Going toggle button to each event card in the home page Upcoming Events section
- Green "RSVP" button (not attending) → amber "✓ Going" pill (attending)
- Calls existing `toggleRsvp(ev.id, currentUser.name)` — same flow as Events page
- Added "X going" count to event cards
- File: `app/dashboard/page.tsx`

**Build:** TypeScript clean. Mobile PWA: cache mtc-court-cc0bf142.

### Cowork Session (2026-03-08j) — Booking Cancel Fix, CI Fix, Sidebar Polish

**Booking cancellation bug (CRITICAL):**
- Root cause: `addBooking()` in store.tsx adds booking to state with client-generated short ID (e.g. `b-2518d915`), then POST to `/api/dashboard/bookings` generates a NEW server-side ID (full UUID). The server response ID was never written back to React state. When user clicks Cancel, it sends the client ID → API returns "Booking not found".
- Fix: Added `.then()` after addBooking's apiCall that reads `data.booking.id` from server response and updates the booking ID in state via `setBookings(prev => prev.map(...))`. localStorage auto-updates via useEffect.
- File: `app/dashboard/lib/store.tsx`

**CI E2E fix — ARIA labels test timeout:**
- `tests/mobile-pwa.spec.js:124`: `waitForSelector('.screen[aria-label]')` timed out because screens are in DOM but hidden behind login screen (not visible).
- Fix: Added `{ state: 'attached' }` to not require visibility.
- File: `tests/mobile-pwa.spec.js`

**Sidebar scrollbar removed:**
- Sidebar `<nav>` had `overflow-y-auto` which showed a scrollbar when many nav items (admin sees 10+ items).
- Fix: Added `scrollbar-hide` utility class (hides scrollbar via `-ms-overflow-style: none`, `scrollbar-width: none`, `::-webkit-scrollbar { display: none }`) while keeping overflow-y-auto for functional scrolling.
- Reduced nav padding from `py-4` to `py-3` for tighter fit.
- Files: `app/dashboard/components/Sidebar.tsx`, `app/globals.css`

**Alex Thompson RSVP (orphaned data):**
- No user named "Alex" exists in Supabase `profiles` or `auth.users`.
- `event_attendees` stores `user_name` as plain text (not FK to profiles), so the RSVP persists after user deletion.
- Fix: Run `DELETE FROM event_attendees WHERE user_name = 'Alex';` on production Supabase.

**Visual verification completed:**
- Dashboard home: quick action cards, upcoming bookings (3 confirmed), upcoming events with RSVP + going counts ✓
- Book Court: week view, 4 courts grid, booking creation works, "You" slots appear ✓
- Partners: filter tabs, skill levels, post request, cancel request ✓
- Events: calendar view, event cards, type badges, RSVP buttons ✓
- Messages: conversation list, avatars, timestamps, new message button ✓
- Booking cancel: was broken (now fixed), needs redeploy to verify

**Build:** TypeScript clean.

### Cowork Session (2026-03-08k) — Cross-Platform Migration (Dashboard ↔ Mobile ↔ API)

**Full cross-platform audit completed. 4 gaps fixed:**

**1. Event RSVP notifications added to mobile API:**
- Mobile API POST `/api/mobile/events` now fires bell + push notification on RSVP (was silent).
- Matches dashboard behavior (bell + push on RSVP, nothing on un-RSVP).
- File: `app/api/mobile/events/route.ts`

**2. Program enroll/withdraw routed through API:**
- `enrollInProgram()` and `withdrawFromProgram()` in store.tsx now use `apiCall('/api/mobile/programs', 'POST', { programId, action })` instead of direct `db.*` calls.
- API handles all notification layers (bell, push, email, coach welcome message) — dashboard no longer duplicates this logic.
- Dramatically simplified store functions (from ~80 lines each to ~15 lines).
- File: `app/dashboard/lib/store.tsx`

**3. Mobile PWA Realtime subscriptions expanded:**
- Added 4 new table subscriptions: `announcements`, `coaching_programs`, `program_enrollments`, `profiles`.
- Added 3 new refetch functions: `refetchAnnouncements()`, `refetchPrograms()`, `refetchMembers()`.
- `refetchAll()` now includes announcements + programs.
- Mobile now subscribes to 13 tables (was 9), matching dashboard's 14.
- File: `public/mobile-app/js/realtime-sync.js`

**4. Remaining direct-DB mutations routed through API:**
- `dismissAnnouncement()` → `apiCall('/api/mobile/announcements', 'PATCH', { announcementId, dismiss: true })`
- `deleteReadNotifications()` → `apiCall('/api/mobile/notifications', 'DELETE', {})`
- Added DELETE handler to `/api/mobile/notifications/route.ts` (deletes all read notifications for user).
- Files: `app/dashboard/lib/store.tsx`, `app/api/mobile/notifications/route.ts`

**Remaining direct-DB calls in store.tsx (all safe):**
- `addProgram()` / `cancelProgram()` → `db.createProgram()` / `db.cancelProgram()` — coach/admin-only, RLS not an issue
- `db.createNotification()` — optimistic bell notifications, INSERT policy exists
- `db.createBooking()` — only used for program session bookings (coach-only)
- All `db.fetch*()` functions — SELECT only, safe with RLS

**Audit results — no issues found:**
- Data format consistency: All camelCase field names match between dashboard and API ✓
- Notification parity: All actions fire symmetric bell + push on both platforms ✓
- Feature parity: Booking, messaging, partners, events all equivalent ✓

**Build:** 29 JS → 358KB, 23 CSS → 225KB, cache: mtc-court-42a92926. TypeScript clean. 747 tests pass (27 files).

---

### Cowork Session (2026-03-08l) — Events Calendar Month Filter + Login Mockup Glassmorphism

**Dashboard events calendar — limited to current month:**
- Was showing ALL season events regardless of which month was selected
- Fixed: events filter now checks `d.getFullYear() === calendarDate.getFullYear() && d.getMonth() === calendarDate.getMonth()`
- Mobile PWA unaffected (uses different filtering approach)
- File: `app/dashboard/events/page.tsx` (lines 39-46)

**Login page desktop mockup — glassmorphism aligned with real dashboard:**
- Quick action cards: `blur(16px)` (was 12px), `border: rgba(255,255,255,0.3)` (was 0.35), `boxShadow: 0 4px 24px` (was 16px), added WebkitBackdropFilter
- Content cards (Bookings/Events): `background: rgba(255,255,255,0.6)` (was 0.55), exact same shadow as glass-card class
- Header bar: `blur(16px)` (was 12px), softened border
- Background silhouette: `opacity: 0.6` (was 0.55), warmer cream tone `#e8e4d9`
- All values now match `glass-card` CSS class exactly: `backdrop-filter: blur(16px)`, `box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)`
- File: `app/login/page.tsx`

**TypeScript:** Clean (0 errors).

---

### Cowork Session (2026-03-08m) — Welcome Message Fixes + Admin Name Override

**Welcome message firing on every login (BUG FIX):**
- Root cause: Auth callback (`app/auth/callback/route.ts`) ran welcome tasks on EVERY login — no guard for returning users.
- Fix: Added guard checking if `welcome-{userId}` message already exists in DB before running welcome tasks. If exists → skip all welcome tasks and return response immediately.
- File: `app/auth/callback/route.ts` (lines 111-120)

**Admin conversations always show "Mono Tennis Club" (BUG FIX — cross-platform):**
- Root cause: Conversation list resolved other member's PROFILE name. Admin's profile was "F4Sport"/"F4S", so that's what displayed.
- Fix (3 codebases updated):
  1. **Dashboard** (`db.ts` `fetchConversations()`): Batch-fetches `role` for all other-member IDs. If `role === 'admin'` → override `memberName` to "Mono Tennis Club".
  2. **Mobile API** (`conversations/route.ts`): Added `role` to profile SELECT. If `role === 'admin'` → override `otherUserName` to "Mono Tennis Club" in profileMap.
  3. **Mobile PWA** (`messaging.js`): 3 locations (conversation list, chat header, reply sender name) now check `member.role === 'admin'` → display "Mono Tennis Club".
- Files: `app/dashboard/lib/db.ts`, `app/api/mobile/conversations/route.ts`, `public/mobile-app/js/messaging.js`

**Welcome message migration:** Run on production Supabase (via SQL editor in browser). `send_welcome_message` function now says "gate code will be provided after Opening Day."

**Build:** 29 JS → 358KB, 23 CSS → 225KB, cache: mtc-court-7444603e. TypeScript clean.

---

## TODO / REMINDERS
- **Deploy to Railway** — all pending changes (welcome guard, admin name override, booking cancel fix, cross-platform migration, sidebar fix, events calendar, login mockup)
- **Delete orphaned Alex RSVP** — `DELETE FROM event_attendees WHERE user_name = 'Alex';` on production Supabase
- **Junior Summer Camp dates**: User is waiting on real dates from Mark Taylor. When received, update the `junior-summer-camp` event across: `supabase/seed.sql`, `app/dashboard/lib/data.ts`, `public/mobile-app/js/events.js`, and run UPDATE SQL on live Supabase. Also update date/time in `app/(landing)/layout.tsx` JSON-LD if camp is featured there.
- **Finish visual verification**: Settings, Book Lessons, Admin Panel still need checking (session expired during previous verification)

## Decisions Made
- Double-booking prevention: DB-level partial unique index on `(court_id, date, time) WHERE status = 'confirmed'`
- Mobile PWA logout: clears all 11 app localStorage keys (added `mtc-session-hash`)
- "Remember Me" stores email only, never passwords — session persistence handled by Supabase tokens
- Demo credentials only available in development mode
- Auth callback validates code exchange result and redirects with error on failure
- Password reset URL configured via `NEXT_PUBLIC_SITE_URL` env var
- **Local verification**: Use `npm run check` (tsc + mobile build) instead of `npm run build` in Cowork/Claude Code sessions. Full Next.js build times out in the VM.
- Landing page events are static TypeScript (marketing/SEO purpose), different from dashboard events (operational/RSVP)
- **CRITICAL RULE — Cross-Platform Sync:** ALL features must be synced across desktop PWA and mobile PWA. Check all 3 codebases on ANY change.
