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
- ~~Create `push_subscriptions` table in Supabase~~ ✅ DONE (2026-03-03)
- ~~push_subscriptions RLS~~ ✅ DONE (2026-03-03)
- ~~Replace `SMTP_PASS` in `.env.local` with actual Google App Password~~ ✅ DONE (2026-03-03)

### Backend Production Readiness (2026-03-03)
Full backend production work: security fixes, seed data update, mobile API endpoints, and mobile PWA Supabase wiring.

**Phase 1 — Security Fixes (4 files):**
- `supabase/rls.sql` — Added RLS for `push_subscriptions` (read/create/delete own only). All 18 tables now covered.
- `app/api/push-subscribe/route.ts` — Added Bearer token auth: validates caller via `supabase.auth.getUser(token)`, verifies userId matches authenticated user
- `app/api/push-send/route.ts` — Added admin-only auth: validates Bearer token + checks `role = 'admin'` in profiles
- `app/api/booking-email/route.ts` — Added recipient email validation: queries profiles table, rejects unknown emails

**Phase 2 — Seed Data (1 file):**
- `supabase/seed.sql` — Complete rewrite: synced with current codebase events (Euchre Tournament, French Open Social, Wimbledon Social added; tournament dates fixed to Jul 18-19; camp changed to TBC; mark-taylor-classes added; courts table fixed to match schema — removed non-existent columns)

**Phase 3 — Mobile API Endpoints (8 files, 7 new):**
- `app/api/mobile/auth-helper.ts` — NEW shared auth helper: `authenticateMobileRequest()` validates Bearer token + returns user profile; `getAdminClient()` for service-role queries
- `app/api/mobile-auth/route.ts` — Now returns `userId` and `accessToken` (Supabase session token) for mobile PWA API calls
- `app/api/mobile/events/route.ts` — NEW: GET events with attendee lists
- `app/api/mobile/bookings/route.ts` — NEW: GET confirmed bookings with participants
- `app/api/mobile/members/route.ts` — NEW: GET active members (email only visible to admins)
- `app/api/mobile/partners/route.ts` — NEW: GET available partner requests
- `app/api/mobile/announcements/route.ts` — NEW: GET announcements with dismissal status
- `app/api/mobile/conversations/route.ts` — NEW: GET conversations + messages for authenticated user

**Phase 4 — Mobile PWA Wiring (6 files):**
- `public/mobile-app/js/api-client.js` — Auto-includes `Authorization: Bearer <token>` header; added `MTC.fn.loadFromAPI()` generic data loader with localStorage cache + offline fallback
- `public/mobile-app/js/auth.js` — Stores `accessToken` and `userId` on login; clears on logout (including API cache keys); `loadAppDataFromAPI()` triggers after login to hydrate all screens from Supabase
- `public/mobile-app/js/events.js` — Added `window.updateEventsFromAPI()` receiver to merge API events into `clubEventsData`
- `public/mobile-app/js/messaging.js` — Added `window.updateMembersFromAPI()` and `window.updateConversationsFromAPI()` receivers
- `public/mobile-app/js/navigation.js` — Added `window.updatePartnersFromAPI()` receiver to replace home partner pool
- `public/mobile-app/js/booking.js` — Added `window.updateBookingsFromAPI()` and `window.updateAnnouncementsFromAPI()` receivers

**TypeScript:** Clean ✓ (0 errors)
**Mobile build done:** `npm run build:mobile` → `mtc-court-456207f1` ✅

**User needs to do in Supabase:**
1. ~~Run the new `push_subscriptions` RLS SQL~~ ✅ DONE (table + RLS created 2026-03-03)
2. ~~Re-run updated `seed.sql`~~ ✅ DONE (2026-03-03)
3. ~~Create 3 auth users~~ OBSOLETE — demo accounts removed, user creates real accounts
4. ~~Demo accounts deleted~~ ✅ DONE (member@mtc.ca, coach@mtc.ca, admin@mtc.ca removed 2026-03-03)
5. ~~Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`~~ ✅ DONE (2026-03-03) — also added to Railway
6. ~~Set `SMTP_PASS`~~ ✅ DONE (Google App Password set in .env.local + Railway)
7. ~~Run security advisory SQL~~ ✅ DONE (2026-03-03) — SET search_path on all functions + RLS for club_settings/event_attendees/notifications
8. ~~Apply email templates~~ ✅ DONE (2026-03-03) — confirm-signup + reset-password cream templates in Supabase Auth

### Demo Removal Session (2026-03-03)
Stripped ALL demo/fake data from the entire codebase. Every platform now shows empty states when no real Supabase data exists — no more fake members, bookings, conversations, or names.

**Dashboard (`app/dashboard/lib/`):**
- `data.ts` — Emptied: `DEFAULT_MEMBERS`, `DEFAULT_BOOKINGS`, `DEFAULT_PARTNERS`, `DEFAULT_CONVERSATIONS`, `DEFAULT_NOTIFICATIONS` all set to `[]`. `DEFAULT_ANALYTICS` zeroed. `DEFAULT_EVENTS` attendees emptied. Kept real data: `DEFAULT_COURTS`, `DEFAULT_PROGRAMS`, `DEFAULT_ANNOUNCEMENTS`.
- `store.tsx` — Removed `isSupabaseConfigured` import and `demoFallback()` function. Replaced with `safeArray()` (just validates Array.isArray). All state initializations now start as `[]` (no conditional demo data).

**Mobile PWA (source files):**
- `auth.js` — Removed dead demo login code, orphaned `}`, `else` fallback block with 'Alex Thompson' defaults. Fixed comments (demo → production language).
- `messaging.js` — Emptied clubMembers (kept only MTC Club system entry), emptied defaultConversations, removed simulateReply entirely.
- `navigation.js` — Emptied homePartnerPool.
- `booking.js` — Emptied eventRegistrations, removed 17 demo bookings, renamed `generateDemoData` → `generateScheduleData`.
- `profile.js` — Default profile: empty strings/arrays instead of 'Alex Thompson'.
- `payments.js` — Empty currentUser, emptied allMembersPayment.
- `account.js` — Emptied match history.
- `events.js` — Removed demo names from avatarMap (kept real board members), emptied all attendees arrays.
- `events-registration.js` — Emptied 3 rsvpLists, nulled volunteer assignment.
- `admin.js` — Emptied 3 rsvpLists, nulled volunteer assignment, member list now dynamic from API with board member fallback.
- `index.html` — All hardcoded demo names (James Park, Mike Chen, Sarah Wilson, Alex Thompson, Emily Rodriguez) → "—" placeholder.

**Other:**
- `supabase/seed.sql` — Removed v_alex/v_mark/v_admin variables and demo user profile updates. Coach lookup now generic (`role = 'coach' limit 1`).
- `app/login/page.tsx` — Changed "David Kim"/"Lisa Thompson" → "Member" in decorative cards.

**Test files updated:**
- `config.test.js` — Removed `credentials` test (property no longer exists in config.js)
- `dashboard.spec.js` — Profile test no longer hardcodes "Alex Thompson", uses generic heading selector
- `qa-full-flow.spec.js` — Profile + admin member list tests use generic assertions
- `untested-flows.spec.js` — Removed CSV export demo name assertions

**Verification:** TypeScript clean ✓, all IIFE closures intact, zero demo name references in source files or test files.
**Mobile build done:** `npm run build:mobile` → `mtc-court-456207f1` (231KB JS, 191KB CSS)

**User can now delete demo accounts from Supabase:**
- Remove member@mtc.ca, coach@mtc.ca, admin@mtc.ca from Auth + profiles table
- Item 3 from "User needs to do" list above is now OBSOLETE (don't create demo accounts)
- E2E tests still use `member@mtc.ca` to log in — update credentials in test files when real accounts are set up

### Production Config Session (2026-03-03)
All Supabase + Railway configuration completed. Platform is production-ready.

**Supabase SQL (all run in SQL Editor):**
- `seed.sql` — seeded courts, events, announcements, coaching programs, gate code
- Security advisory fixes — `SET search_path = ''` on all 5 SECURITY DEFINER functions (`is_admin`, `is_coach`, `handle_new_user`, `delete_member`, `send_welcome_message`), fully-qualified table names
- RLS added for `club_settings`, `event_attendees`, `notifications`
- Note: `delete_member` required `DROP FUNCTION` first due to parameter rename (`target_user_id` → `member_id`)

**Supabase Dashboard:**
- Email templates applied: `confirm-signup.html` + `reset-password.html` (cream theme) in Auth → Email Templates

**Env vars (.env.local + Railway):**
- `SUPABASE_SERVICE_ROLE_KEY` added
- `SMTP_PASS` set with Google App Password
- All SMTP + VAPID vars confirmed in Railway

**Landing page changes:**
- `Events.tsx` — Restored filter pills (All Events, Tournaments, Camps, Coaching, Social) + date-aware 3-card limit (shows next 3 upcoming events, auto-rotates as dates pass)
- `OnboardingTour.tsx` — Added Settings step (step 5 of 6), title changed to "Welcome to MTC Court!"
- `Sidebar.tsx` — Added `data-tour="settings"` attribute
- `landing.spec.js` — Event card count test updated to expect 3

**All code pushed, Railway deployed. All Supabase manual tasks complete.**

### Skill Level + Family Membership Feature (2026-03-03)
Two major features implemented across 10+ files:

**Skill Level at Signup:**
- `supabase/schema.sql` — Added `skill_level_set boolean default false` to profiles; updated `handle_new_user()` trigger to read `skill_level` from auth metadata
- `app/dashboard/lib/types.ts` — Added `skillLevelSet?: boolean` to User
- `app/dashboard/lib/auth.ts` — `signUp()` accepts `skillLevel` param, passes in metadata; both profile mappers now include `skillLevelSet`
- `app/dashboard/lib/db.ts` — Maps `skill_level_set` in profile fetches
- `app/signup/page.tsx` — New Step 3 (Skill Level) with beginner/intermediate/advanced/competitive cards; steps renumbered 3→4→5→6
- `app/dashboard/profile/page.tsx` — `saveSkillLevel()` now sets `skill_level_set: true`
- `app/dashboard/page.tsx` — Reminder banner for users with `skillLevelSet !== true`

**Family Membership (Netflix-style profiles):**
- `supabase/schema.sql` — Added `families` table, `family_members` table (2 adults + 4 juniors max), `membership_type`/`family_id` on profiles, `booked_for` on bookings, RLS policies, indexes
- `app/dashboard/lib/types.ts` — Added `FamilyMember` interface, `ActiveProfile` type union, `membershipType`/`familyId` on User, `bookedFor` on Booking
- `app/dashboard/lib/db.ts` — Added `createFamily()`, `fetchFamilyMembers()`, `addFamilyMember()`, `updateFamilyMember()`, `removeFamilyMember()` + `booked_for` in booking create/fetch
- `app/dashboard/lib/auth.ts` — `membershipType`/`familyId` mapped in both signIn + getCurrentUser
- `app/dashboard/lib/store.tsx` — Added `familyMembers`, `activeProfile`, `switchProfile`, computed `activeDisplayName`/`activeAvatar`/`activeSkillLevel`; persists active profile to localStorage; fetches family data on login
- `app/signup/page.tsx` — Dynamic 6/7 step wizard (family gets Step 3: Family Members); creates family group + members after signup
- `app/dashboard/components/DashboardHeader.tsx` — Profile switcher in menu dropdown (primary + family members with checkmark on active)
- `app/dashboard/profile/page.tsx` — Family Members management card (add/remove/edit skill level per member, enforces 2 adult + 4 junior limits)
- `app/dashboard/book/page.tsx` — `bookedFor` set from `activeDisplayName` when family member profile is active

**TypeScript:** Clean ✓

**Pricing Display:**
- `app/info/data.ts` — Added `desc` field to all membershipTypes ("Up to 2 adults + 4 juniors, one account with switchable profiles" for family)
- `app/signup/page.tsx` — Step 1 cards now show description text under each membership label
- `app/info/components/MembershipTab.tsx` — Fees table now shows description under each fee label

**Mobile PWA Family Parity:**
- `app/api/mobile-auth/route.ts` — Now returns `membershipType`, `familyId`, and `familyMembers[]` array after login
- `public/mobile-app/js/auth.js` — Stores `membershipType`/`familyId` on currentUser, stores `familyMembers` + `activeFamilyMember` in MTC.state + localStorage, clears on logout, restores on re-login
- `public/mobile-app/js/profile.js` — Added family profile switcher: `switchFamilyProfile()`, `renderFamilySwitcher()`, `getActiveDisplayName()`; pill-based UI in profile screen
- `public/mobile-app/js/booking.js` — Booking toast shows active family member name when booking as a family member
- `public/mobile-app/index.html` — Added `#familySwitcher` div in profile screen
- `public/mobile-app/css/profile.css` — Family switcher pill styles (green theme, active state)
- **Mobile build done:** `npm run build:mobile` → `mtc-court-592c70f8` (233KB JS, 192KB CSS)

**User needs to run SQL in Supabase:**
- CREATE TABLE families + family_members
- ALTER TABLE profiles ADD membership_type + family_id
- ALTER TABLE bookings ADD booked_for
- CREATE OR REPLACE FUNCTION handle_new_user() (updated trigger)
- RLS policies for families + family_members
- Indexes

### Polish Pass Session (2026-03-03)
3 fixes applied:

**Booking Emails:**
- `app/api/booking-email/route.ts` — `buildEmailHTML` call now passes `bookedFor` param. Family member name shows in confirmation emails ("Court booked for [name]" / "Booked for" row in details table).

**Admin Panel:**
- `app/dashboard/admin/page.tsx` — Added "Membership" column to members table (Adult/Family/Junior badges with purple/blue/green colors). CSV export now includes Membership + Status columns.

**Member Directory:**
- `app/dashboard/directory/page.tsx` — Family membership badge shown on member cards (purple "Family" tag next to name).

**Verification:** TypeScript clean ✓, mobile build done (mtc-court-04f8b3c1)

### Animation & UX Polish Session (2026-03-03)
15 animation/UX improvements across all 3 platforms:

**Landing Page (4 changes):**
- `landing.css` — Hero CTA breathing pulse (`.hero-cta-pulse` keyframe on box-shadow), event card hover border-color shift to green, calendar detail panel horizontal slide-in (`.cal-detail-slide-x`), stagger delay utility classes (`.fade-in-delay-1` through `-5`)
- `Hero.tsx` — Added `hero-cta-pulse` class to "Become a Member" button
- `Schedule.tsx` — Added `cal-detail-slide-x` class to day detail panel

**Dashboard (5 changes):**
- `globals.css` — Page enter animation (`.page-enter`), full-screen booking confetti (`.dash-confetti-piece`), bell notification shake (`.bell-notify`), activity feed stagger (`.feed-item` with nth-child delays), profile switcher crossfade (`.profile-switch-enter`)
- `SuccessModal.tsx` — Full-screen confetti burst (30 pieces) fires on booking success, auto-cleans after 4s
- `DashboardHeader.tsx` — Bell shakes when `unreadCount` increases (tracks previous count via ref)

**Mobile PWA (6 changes):**
- `enhancements.css` — Pull-to-refresh indicator styles (`.ptr-indicator`, spinner, arrow rotation), enhanced button tap feedback (`.action-btn:active` scale 0.97), toast spring bounce animation (`.toast.show` with cubic-bezier overshoot)
- `navigation.js` — Pull-to-refresh touch handler for home + schedule screens (60px threshold, calls `loadAppDataFromAPI()`, shows spinner, toast on complete)
- `index.html` — Added `#ptrIndicator` element inside `#app`

**Pre-existing (already had):** Screen slide transitions (from-left/from-right), skeleton loaders (full system), staggered entrance animations, toast slide-in, button active states

**Verification:** TypeScript clean ✓, mobile build done (mtc-court-adc9e80c, 235KB JS, 193KB CSS)

### Cross-Platform Time Format Audit Session (2026-03-03)
Deep audit found and fixed 7 issues across mobile PWA + API routes. All caused by 24h↔12h time format mismatch after config.js was converted to 12h AM/PM.

**Events & UX (Landing Page):**
- `Events.tsx` — Added real coaching schedule from coach's wife (Junior Programs Mon/Tue/Thu/Fri, Adult Programs Mon/Tue/Fri), real round robins from data.ts (Men's RR, Freedom 55, Ladies RR, Friday Mixed), Summer Camps TBA. Added empty state for filter tabs, skeleton loading.
- `landing.css` — Hero CTA pulse replaced with static glow (user found it annoying)
- `utils.js` — Added crash recovery overlay (mobile error boundary, 3 errors in 10s triggers reload overlay)

**CRITICAL datetime parsing fixes:**
- `payments.js` — Added `parseTime12h()` + `buildBookingDate()` helpers. Fixed `formatTime()` and `formatPaymentTimeRange()` for 12h input. Replaced 2 broken `new Date(date+'T'+time+':00')` calls with `buildBookingDate()`.
- `booking.js` — Changed all program times + special event times from 24h to 12h AM/PM format.
- `mobile-booking/route.ts` — Fixed DELETE handler: proper 12h→24h conversion for cancellation window datetime.

**Data accuracy fixes:**
- `events-registration.js` — Interclub corrected: Saturday 1-5 PM → Every Thursday 7-9:30 PM. French Open/Wimbledon day labels: Saturday → Sunday (verified with `new Date().getDay()`).
- `mobile-booking/route.ts` — POST handler: added `court_name`, `user_name`, `booked_for`, `type` to Supabase insert; added `bookedFor`/`userName` to destructured body.

**Email tracking:**
- `supabase/schema.sql` — Added `email_sent_at timestamptz` to bookings table
- `app/api/booking-email/route.ts` — Stamps `email_sent_at` after successful sends
- `app/dashboard/lib/store.tsx` — Passes `bookingId` to booking-email fetch

**Verification:** TypeScript clean ✓, mobile build done (mtc-court-36109d61, 237KB JS, 193KB CSS)

**User needs to run in Supabase:**
- `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;`

## TODO / REMINDERS
- **Junior Summer Camp dates**: User is waiting on real dates from Mark Taylor. When received, update the `junior-summer-camp` event across: `supabase/seed.sql`, `app/dashboard/lib/data.ts`, `public/mobile-app/js/events.js`, and run UPDATE SQL on live Supabase. Also update date/time in `app/(landing)/layout.tsx` JSON-LD if camp is featured there.

## Decisions Made
- Double-booking prevention: DB-level partial unique index on `(court_id, date, time) WHERE status = 'confirmed'` — already implemented, no code change needed
- Mobile PWA logout: clears all 11 app localStorage keys (added `mtc-session-hash`)
- "Remember Me" stores email only, never passwords — session persistence handled by Supabase tokens
- Demo credentials only available in development mode
- Auth callback validates code exchange result and redirects with error on failure
- Password reset URL configured via `NEXT_PUBLIC_SITE_URL` env var (defaults to production domain)
