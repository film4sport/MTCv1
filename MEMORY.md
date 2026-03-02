# MEMORY.md - Persistent Context for Claude Code

## Workflow Tools
- **Cowork (Claude Desktop)** is available for interactive browser-based visual verification. Use Cowork for subjective visual checks ("does this look right?", hover states, animations, glass morphism rendering, full-page scrollthroughs). Use Claude Code + Playwright for automated regression checks ("did this break?").
- **Code review reports**: `MTC-Code-Review-Report.docx` (38 findings) and `MTC-Bug-Hunting-Report.docx` (39 findings) in project root.

## Current Status
- **SMTP/Supabase email signups**: DONE. Google SMTP configured in Supabase dashboard. Email confirmation and password reset emails are live.

### Cowork Bug-Fix Session (2026-03-01)
12 bugs fixed across 11 files. All verified visually in Chrome with no console errors.

**Landing Page (Next.js):**
- `app/(landing)/page.tsx` — MutationObserver debounced with rAF (was firing hundreds of times during animations)
- `app/(landing)/components/Loader.tsx` — Race condition fix: `triggered` ref guard prevents double-trigger between timeout and onLoad
- `app/(landing)/components/Hero.tsx` — Parallax scroll handler throttled with rAF
- `app/(landing)/components/Schedule.tsx` — AbortController + 8s timeout on booking data fetch

**Dashboard:**
- `app/dashboard/lib/store.tsx` — sendMessage rollback now removes only the failed message instead of restoring a stale snapshot (was overwriting other users' messages)

**API:**
- `app/api/mobile-auth/route.ts` — Timing-safe password comparison using `crypto.timingSafeEqual`

**Mobile PWA (source files — NEED `npm run build:mobile` to bundle):**
- `public/mobile-app/js/auth.js` — 24-hour session expiry check, full logout clears all 10 localStorage keys
- `public/mobile-app/js/interactive.js` — Removed stale hardcoded cache name `mtc-court-v148`
- `public/mobile-app/js/utils.js` — Corrupted localStorage auto-cleanup on parse error
- `public/mobile-app/js/messaging.js` — avatarSVGs guard for undefined reference
- `public/mobile-app/sw.js` — Cache fallback on HTTP errors (try cache before returning error response)

**DONE:** Mobile build (`npm run build:mobile`) completed and E2E tests passed.

**Already in place (no action needed):**
- Double-booking UNIQUE index already exists in `supabase/schema.sql` (line 205-206: `idx_bookings_no_double_booking`)

### Cowork QA + Fix Session (2026-03-02)
Comprehensive QA across all auth, booking, messaging, and partner flows. 10 fixes applied:

**Security fixes:**
- `app/login/page.tsx` — Removed base64 password storage from "Remember Me" (OWASP violation). Now stores email only, cleans up legacy `mtc-remember-pwd` key
- `app/api/mobile-auth/route.ts` — Demo credentials gated behind `NODE_ENV !== 'development'` (won't work in production)
- `public/mobile-app/js/auth.js` — Offline auth now requires password hash match (was allowing any password with cached email)
- `app/auth/callback/route.ts` — Added error handling for expired/invalid auth codes, redirects to `/login?error=expired_link`

**Auth fixes:**
- `app/signup/page.tsx` — Trim email + name before signup; clear errors when navigating between steps
- `app/login/page.tsx` — Lowercase + trim email before signIn; clear previous errors on submit; handle `?error=expired_link` param
- `app/dashboard/lib/auth.ts` — Password reset URL uses `NEXT_PUBLIC_SITE_URL` env var instead of hardcoded production URL

**UX fixes:**
- `app/(landing)/components/Lightbox.tsx` — Full focus trap cycling (Tab/Shift+Tab through all focusable elements)
- `app/(landing)/components/Hero.tsx` — Descriptive SEO alt text for hero image

**DONE:** Mobile build and E2E tests passed.

### Claude Code Refactor Session (2026-03-02)
All 10 remaining items from QA session completed:

**Quick fixes:**
- `NEXT_PUBLIC_SITE_URL` added to `.env.local` and `.env.example`
- `app/login/page.tsx` — `autoComplete="new-password"` on both password reset inputs
- `app/dashboard/book/components/BookingModal.tsx` — Guest name XSS sanitization (strips HTML tags, special chars, max 100 chars)

**Rate limiting:**
- `app/api/reset-password/route.ts` — NEW server-side rate-limited password reset endpoint (3 requests per email per 15 min)
- `app/dashboard/lib/auth.ts` — `resetPassword()` now calls `/api/reset-password` instead of Supabase directly
- `app/login/page.tsx` — 60-second client-side cooldown timer on forgot password button

**Event delegation (mobile PWA):**
- `public/mobile-app/js/event-delegation.js` — NEW central event delegation module with `data-action` attribute system
- Converted high-risk dynamic onclick handlers (those concatenating user data) across: `navigation.js` (partner join), `messaging.js` (member search), `admin.js` (task manager, assign), `partners.js` (remove request), `events-registration.js` (member profile), `payments.js` (booking actions, admin payment actions)
- Static/hardcoded onclick handlers left as-is (lower risk, would be massive refactor)

**Server-side APIs (mobile PWA):**
- `app/api/mobile-booking/route.ts` — NEW booking validation + creation API with: court validation, date range check (7-day advance), time format validation, court close time check, participant limits, double-booking prevention via Supabase unique constraint, rate limiting (10/hour/user), cancellation with 24h window enforcement
- `app/api/mobile-signup/route.ts` — NEW signup API with: rate limiting (3/IP/15min), email/password validation, name sanitization, Supabase auth integration

**Optimistic rollback + background sync (mobile PWA):**
- `public/mobile-app/js/api-client.js` — NEW API client module with: `apiRequest()` (fetch with timeout + abort), `optimisticAction()` (apply → API call → rollback on failure), `createBooking()`, `cancelBooking()`, `signup()` helpers, offline queue with background sync
- `public/mobile-app/sw.js` — Enhanced: background sync handlers for bookings/messages, rich push notification payload parsing, notification click focuses existing window, SW message listener for SKIP_WAITING

**Build:**
- `scripts/build-mobile.js` — Added `event-delegation.js` and `api-client.js` to JS bundle
- Mobile build output: 26 JS files → `dist/app.bundle.js` (243KB minified)
- Next.js production build passes ✓

**Pre-existing test failures — NOW FIXED (see Finish-Off Session below)**

### Partner-Finding Enhancement (2026-03-02)
Enhanced the dashboard partner page (`/dashboard/partners`) with skill level preference and message field, bringing it to parity with the mobile PWA.

**Type + Schema:**
- `app/dashboard/lib/types.ts` — `message?: string` already on Partner interface
- `supabase/schema.sql` — `message text` column already on partners table
- `app/dashboard/lib/db.ts` — `message` mapped in `fetchPartners()` and `createPartner()`

**Post Request Modal (`app/dashboard/partners/page.tsx`):**
- Match type converted from `<select>` to pill buttons (Any / Singles / Doubles / Mixed Doubles)
- Added "Preferred Skill Level" pill selector (Any Level / Beginner / Intermediate / Advanced / Competitive)
- Added optional "Message" textarea (maxLength 200)
- Submit sets `skillLevel` from picker (undefined if "any"), includes `message`
- State resets on submit

**Partner Card Updates:**
- Shows message as italic quote below availability
- Skill badge: "Looking for {level}" or "Any Level" with green-tinted badge
- `skillLevel: undefined` handled as "Any Level"

**Filter Logic Fix:**
- Old: `p.skillLevel ?? 'intermediate'` (forced default)
- New: `if (skillFilter !== 'all' && p.skillLevel && p.skillLevel !== skillFilter) return false;`
- Partners requesting "any level" now appear in ALL skill filter views

**Mock Data (`app/dashboard/lib/data.ts`):**
- Sarah Wilson: "Looking for a practice partner before league night!"
- Emily Rodriguez: no skillLevel set + "New to the club, happy to play with anyone!"

**Build:** TypeScript passes clean ✓

### Cowork UX Features Session (2026-03-02)
8 UX features implemented to bring platform closer to 10/10 polish:

**Feature 1: Notification Bell Enhancements**
- `app/dashboard/lib/store.tsx` — `toggleRsvp()` now creates event notification when RSVPing; `addPartner()` now creates partner notification. `enrollInProgram()` already had it.

**Feature 2: Booking Confirmation + Cancellation Emails (cream theme)**
- `app/api/booking-email/route.ts` — Rewritten: multi-recipient support (booker + all participants get personalized emails). Cream theme (#faf8f3/#f5f2eb) matching site design. POST for confirmations, DELETE for cancellations with METHOD:CANCEL ICS to auto-remove from calendars.
- `app/dashboard/lib/store.tsx` — `addBooking()` sends emails to booker + all participants (looks up emails from members list). `cancelBooking()` sends cancellation emails + enriched messages with calendar details to all participants.
- Participant messages now include full calendar details (date, time, duration, court, match type, all players).
- Cancellation messages include ❌ CANCELLED formatting with full booking details.
- `supabase/email-templates/confirm-signup.html` — Cream-themed Supabase email template for signup confirmation
- `supabase/email-templates/reset-password.html` — Cream-themed Supabase email template for password reset
- **To apply Supabase templates:** Copy HTML from `supabase/email-templates/` into Supabase Dashboard → Authentication → Email Templates

**Feature 3: New Member Onboarding Tour**
- `app/dashboard/components/OnboardingTour.tsx` — NEW component: 5-step tooltip tour with backdrop, step indicators, skip/next. Uses `data-tour` selectors. Persisted via `localStorage('mtc-onboarding-done')`.
- `app/dashboard/page.tsx` — Renders `<OnboardingTour />`; added `data-tour` attributes to Quick Action links
- `app/dashboard/components/Sidebar.tsx` — Added `data-tour="messages"` to Messages nav link

**Feature 4: Quick-Book from Landing Calendar**
- `app/(landing)/components/Schedule.tsx` — Added "Book a Court for this Day" CTA at bottom of day detail panel, links to `/dashboard/book?date=YYYY-MM-DD`
- `app/dashboard/book/page.tsx` — Reads `?date=` URL param via `useSearchParams()`, pre-selects that date in both week and calendar views

**Feature 5: Event RSVP with Headcount**
- `app/dashboard/events/page.tsx` — Added headcount progress bar to event cards (spots filled/total, color changes at 80%); added headcount to event detail modal with attendee count
- `app/(landing)/components/Events.tsx` — Added "Log in to RSVP →" link on each event card

**Feature 6: Member Directory**
- `app/dashboard/directory/page.tsx` — NEW page: search by name, filter by skill level (pill buttons), member cards with avatar initials, role badges, skill badges, member since, "Message" button
- `app/dashboard/components/Sidebar.tsx` — Added "Members" nav item (between Partners and Events) with users icon

**Feature 7: Dashboard Activity Feed**
- `app/dashboard/page.tsx` — Added `<ActivityFeed>` component below two-column grid. Merges recent bookings, partner requests, events with RSVPs, and new members into a sorted timeline (8 items max, clickable).

**Feature 8: Mobile PWA Push Notifications**
- `app/api/push-subscribe/route.ts` — NEW: stores push subscription in Supabase, upsert on conflict
- `app/api/push-send/route.ts` — NEW: sends push notification via web-push library, cleans up expired subscriptions
- `supabase/schema.sql` — Added `push_subscriptions` table (user_id, endpoint, p256dh, auth)
- `public/mobile-app/js/auth.js` — After login, calls `registerPushNotifications()` which requests permission + subscribes via Push API + sends to `/api/push-subscribe`
- **NEEDS:** `npm install web-push` + VAPID keys (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`) + `push_subscriptions` table created in Supabase + `npm run build:mobile`

**TypeScript:** All passes clean ✓

### Finish-Off Session (2026-03-02)
Completed all remaining NEEDS items + fixed all 11 pre-existing test failures.

**npm packages installed:**
- `nodemailer` + `@types/nodemailer` (booking confirmation emails)
- `web-push` (push notifications)

**Env vars added to `.env.local` + `.env.example`:**
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (Gmail SMTP for booking emails)
- VAPID: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` (generated keys for push notifications)
- **NOTE:** `SMTP_PASS` in `.env.local` is set to `REPLACE_WITH_APP_PASSWORD` — needs a Google App Password (same process as Supabase SMTP setup)

**Test fixes (11 failures → 0):**
- `booking-data.test.js` — Updated TIME_SLOTS assertions: 15→24 slots, 9:30 AM→10:00 AM start, 9:00 PM→9:30 PM end
- `coaching-and-settings.test.js` — Rewrote 5 coaching tests to match current CoachingTab.tsx (has real coach emails, not dashboard links)
- `review-fixes.test.js` — Updated sendMessage rollback marker from `setConversations(snapshot)` to targeted rollback `setConversations(prev => prev.map(c =>`
- `auth.test.js` — Updated resetPassword tests to mock `fetch('/api/reset-password')` instead of Supabase `resetPasswordForEmail()` (function was refactored in Refactor Session)

**Mobile PWA build:** ✓ (26 JS files → 244KB, cache: mtc-court-3db48868)
**Unit tests:** 207/207 passing ✓
**TypeScript:** Clean ✓

**Still needs manual action:**
- Create `push_subscriptions` table in Supabase (run SQL from `supabase/schema.sql` lines 330-338)
- Replace `SMTP_PASS=REPLACE_WITH_APP_PASSWORD` in `.env.local` with actual Google App Password

## Decisions Made
- Double-booking prevention: DB-level partial unique index on `(court_id, date, time) WHERE status = 'confirmed'` — already implemented, no code change needed
- Mobile PWA logout: clears all 11 app localStorage keys (added `mtc-session-hash`)
- "Remember Me" stores email only, never passwords — session persistence handled by Supabase tokens
- Demo credentials only available in development mode
- Auth callback validates code exchange result and redirects with error on failure
- Password reset URL configured via `NEXT_PUBLIC_SITE_URL` env var (defaults to production domain)
