# MEMORY.md - Persistent Context for Claude Code

## Workflow Tools
- **Cowork (Claude Desktop)** is available for interactive browser-based visual verification. Use Cowork for subjective visual checks ("does this look right?", hover states, animations, glass morphism rendering, full-page scrollthroughs). Use Claude Code + Playwright for automated regression checks ("did this break?").
- **Code review reports**: `MTC-Code-Review-Report.docx` (38 findings) and `MTC-Bug-Hunting-Report.docx` (39 findings) in project root.
- **⚠️ Image upload MIME bug (Claude Code)**: API throws `400 invalid_request_error` ("image was specified using image/jpeg media type, but appears to be image/png") when a file with `.jpg` extension contains PNG data. This kills the session. **Workaround**: ALWAYS share screenshots as `.png` — never `.jpg`. Windows screenshots (Snipping Tool, Win+Shift+S) are always PNG internally. If pasting from clipboard triggers the error, use `/rewind` immediately. This is a Claude Code bug (MIME detection trusts extension, not actual bytes).
- **User flow testing**: Use BDG (Claude in Chrome) + Guerrilla Mail (guerrillamail.com) to create test accounts and test real user flows (Google login, magic link, signup, booking, etc.) before shipping auth changes. Always verify auth flows end-to-end in the browser — never ship auth changes without testing.
- **Test mock rule**: Before writing/updating E2E test mocks, ALWAYS grep the real source code for the actual localStorage keys, API endpoints, and DOM IDs. Never guess. Past CI failures from wrong mocks: `mtc-current-user` vs `mtc-user`, missing `mtc-onboarding-complete`, asserting on removed `signupPassword` field.

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

---

### Environment Limitations (IMPORTANT)
- **Cowork VM has NO Playwright browsers installed.** Never attempt E2E tests in Cowork.
- **If a command fails once, diagnose and explain — don't retry.**
- **Unit tests (Vitest) DO work in Cowork** — `npm run test:unit` is safe.
- **`npm run check`** (tsc + mobile build) works in Cowork.

## TODO / REMINDERS
- **Junior Summer Camp dates**: User is waiting on real dates from Mark Taylor. When received, update the `junior-summer-camp` event across: `supabase/seed.sql`, `app/dashboard/lib/data.ts`, `public/mobile-app/js/events.js`, and run UPDATE SQL on live Supabase. Also update date/time in `app/(landing)/layout.tsx` JSON-LD if camp is featured there.
- **Run welcome message migration** on production Supabase (`npm run db:push` or SQL manually)
- **Deploy to Railway** to verify admin panels and bug fixes in production

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
