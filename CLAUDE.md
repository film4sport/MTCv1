# CLAUDE.md - MTC Landing Page Project Rules

---
## *** STOP — READ THIS FIRST ***
## #25: NEVER USE THE USER'S PERSONAL EMAIL FOR TESTING
**THIS RULE HAS BEEN VIOLATED MULTIPLE TIMES. READ IT CAREFULLY.**
- The user's personal email is in the `<user>` block (protonmail). **DO NOT USE IT. EVER.**
- When testing in BDG (Chrome), Playwright, Cowork, or ANY browser/tool: **USE ONLY dummy emails.**
- Approved test emails: `test@example.com`, `testuser@mtc.ca` — create a NEW dummy account if needed
- **NEVER use any account the user actually uses** (including `film4sports@gmail.com`) — testing can corrupt their data (PINs, sessions, etc.)
- DO NOT type, paste, or autofill the user's real email into ANY form, URL, API call, or console command.
- **Why**: Browser autofill caches it, then keeps overriding the user's real input on their machine. This has caused repeated frustration.
- **Violation count: 3+** — this is the most-violated rule in the project. If you are about to type an email into a browser, STOP and verify it is NOT the user's personal email.
---

## #1: FOLLOW WHAT WAS DECIDED
**If we already discussed and agreed on an approach, USE IT. Don't invent alternatives.**
- Before making ANY change, check: did we already decide how this should work?
- If yes → follow that decision exactly
- If no → ASK before choosing an approach
- If a fix fails → the decision was right, my implementation was wrong. Debug the implementation, don't change the approach.

## #2: ONLY CHANGE WHAT IS ASKED — ZERO EXTRAS
- **Before EVERY edit, ask yourself: "Did the user ask for this specific change?"** If NO → don't do it.
- **NEVER add features, functionality, UI elements, API endpoints, RPC functions, or logic the user didn't ask for.** Even if it "makes sense." Suggest it in text, let the user decide. Unrequested code = more to test, more to break, and wasted user time removing it.
- If asked to fix 2 things, fix exactly those 2 things. Not 2 + 5 "improvements" you noticed.
- Necessary dependencies of the asked change are OK (e.g. bumping SW cache version when adding a new cached file). Refactors, cleanups, style tweaks, "while I'm here" changes are NOT OK.
- **DO proactively suggest** improvements — but ONLY as text suggestions. Never silently implement them.
- This rule exists because it has been violated repeatedly. Incident: Mar 9, 2026 — unrequested filter tabs + cleanup button added to messages UI, broke 21 CI tests when removed. When in doubt, DON'T touch it.

## #3: GREP BEFORE TOUCHING ANYTHING
- Find ALL locations first
- Fix ALL in one pass
- Verify 0 instances of old pattern remain

## #4: IF FIX FAILS TWICE, STOP AND INVESTIGATE ROOT CAUSE
Don't keep adding CSS. Debug WHY:
1. WHERE is the element in the DOM?
2. Does the CSS selector actually match?
3. What's overriding it? (check load order, specificity, inline styles)

## #5: DON'T INVENT - FIND EXISTING
- Does this already exist? → enable it, don't recreate
- NEVER assume colors/styles - ask or match existing

## #6: AGENT SAFETY — NEVER DESTROY FILES
**Background agents destroyed booking.js (927 lines → 38 bytes of garbage) in the mobile PWA session. NEVER AGAIN.**
- **NEVER let background agents write/edit files** — background agents are OK for read-only research tasks (searching, reading files), but ALL file writing/editing must be done directly in the main conversation
- If an agent needs to make >5 edits in one file, do it in the main conversation instead
- **ALWAYS verify file integrity** after any significant write (`wc -l`, `head -5`, `grep` key exports)

## #7: NEVER SUGGEST prefers-reduced-motion
**Animations are a core design feature of this project.** Do NOT suggest adding `prefers-reduced-motion` media queries. The parallax, shimmer, confetti, bounce, and calendar animations are intentional and must always run.

## #8: NO CLUBSPARK LINKS
All external links to clubspark.ca have been removed. ClubSpark was only used as an info source. Replace with on-page anchors (#faq, #events, #schedule, #directions) or booking overlay triggers.

## #9: ALWAYS UPDATE CLAUDE.md
When new project rules or conventions are established, add them to this file AND MEMORY.md.

## #18: NO TENNIS EMOJI — EVER
**NEVER use the tennis ball emoji (🎾) or any tennis-related emoji anywhere in the codebase.**
- Not in JSX, not in HTML, not in event indicators, not in banners, not anywhere.
- For event/booking slot indicators: use SVG icons, styled text labels, or colored dots — never emoji.
- This rule exists because it was violated repeatedly. The emoji looks cheap and unprofessional.

## #17: ALWAYS VERIFY CHANGES BEFORE REPORTING DONE — MANDATORY, NO EXCEPTIONS
**Never tell the user "it's done" or ship code without verifying it actually works.**
**GATE: The word "done" (or equivalent) CANNOT appear in a response unless a BDG screenshot was taken in that same response. No screenshot = not done. Period.**
- After making changes: rebuild (`npm run build:mobile` for PWA), then visually verify in BDG (Chrome) by taking a screenshot
- After CSS/layout/HTML changes: take a screenshot AND run HTML nesting validation (`python3 -c` div count check)
- After JS logic changes: test the actual behavior in BDG, don't just assume it works
- If BDG is unavailable: say **"I HAVE NOT VISUALLY VERIFIED — you need to check before deploying"** — NEVER say "done"
- **Incident log**: Skipping this rule caused a broken production deploy on Mar 9, 2026 (extra `</div>` closed `#app` early, entire mobile UI broke). User had to discover it themselves on their phone.

## #16: VISUAL TESTING PRIORITY — BDG FIRST, NEVER RETRY BLIND
**BDG (Claude in Chrome) is the PRIMARY tool for visual verification in Cowork. USE IT.**
- After ANY visual/CSS/layout/HTML change: open it in BDG, take a screenshot, verify it looks right
- **Cowork VM does NOT have Playwright browsers installed.** E2E tests only run in CI or locally. Never attempt Playwright in Cowork.
- "No Playwright in Cowork" is NOT an excuse to skip verification — use BDG for visual checks, vitest for unit tests, `npm run check` for type-checking
- Before running any tool/command: verify prerequisites exist first. If it fails, STOP and tell the user WHY — don't retry.
- **Rule of 1**: If it fails once, diagnose. Don't try a second time with a slight variation hoping it works.

## #15: SHARED MEMORY FILE
**`MEMORY.md` in the project root is the single source of truth for session context, status, and decisions.**
- Both Cowork and Claude Code read and write to `MTCv1/MEMORY.md`
- **Do NOT use** Claude Code's internal `.claude/projects/` memory path — all updates go to the project root `MEMORY.md`
- After completing work, update MEMORY.md with: what was changed, what still needs doing, and any decisions made

## #10: VERIFY BEFORE REPORTING — PLAYWRIGHT + BDG COMBO
**Never tell the user "it's done" without verifying visually.**
- **Playwright** — Primary tool for visual verification and regression testing:
  - `npm run test` (E2E), `npm run test:unit` (Vitest), `npm run test:all` (both)
  - Config: `playwright.config.js`, tests in `tests/`, unit tests in `unit-tests/`
  - 3 viewports tested: mobile (375x812), tablet (768x1024), desktop (1280x720)
  - For quick visual checks: write a small Playwright script to screenshot the page
  - Best for: automated screenshots, regression testing, pre-deploy checks
- **Claude in Chrome (BDG)** — Use for live visual verification and interactive checks:
  - Best for: real-time page inspection, verifying hover states, checking interactive elements
- **Cowork (Claude Desktop)** — Use for exploratory visual QA when subjective judgment is needed:
  - Best for: "does this look right?" checks, hover/animation rendering, full-page scrollthroughs, font/glass morphism accuracy
  - Runs a real Chrome browser (not headless), so rendering is more accurate than Playwright screenshots
  - Defer to Cowork for subjective visual checks; use Playwright for automated regression checks
- **Workflow**: Playwright for automated regression tests → Cowork for exploratory visual QA → BDG for quick live spot-checks
- **Mobile/tablet device testing without real devices**: Use Chrome DevTools device toolbar (Ctrl+Shift+M) to emulate iPhone/iPad/Android user agents. For PWA install gate testing, toggle Application > Manifest display mode between "browser" and "standalone". BDG can also resize viewport and take screenshots for visual verification. No need to buy real devices for most testing.

## #12: VISUAL VERIFICATION — PLAYWRIGHT OR BDG ONLY
- **ONLY use Playwright, BDG (Claude in Chrome), or Cowork for ALL visual verification.** No exceptions.
- **NEVER use `preview_screenshot`** — hangs every time.
- **NEVER use `preview_snapshot`/`preview_inspect`/`preview_eval` for visual verification** — user does NOT want these flooding the output. Only use for quick non-visual checks (e.g. confirming a CSS value) when absolutely necessary.
- **For screenshots**: Use **Playwright** inline scripts (`node -e "..."` with `chromium.launch()`) or **BDG** (`computer` action `screenshot`).
- **BDG** for live interaction (hover states, clicking, reading page). Known issues: Loader blocks page (remove via JS), `dynamic()` ssr:false components may not render.
- **Key rule**: If ANY tool stalls, switch immediately. Never retry the same broken approach.
- User runs `next dev` on port 3000. `preview_start` uses port 3001 via launch.json.

## #13: ALWAYS ENSURE CI PASSES AFTER CHANGES
After making code changes, verify they won't break GitHub Actions CI:
- **Don't run full E2E locally** (too slow) — instead, review the test specs for anything your changes could break
- Check that existing test assertions still match (text content, selectors, element counts)
- If a CSS/layout change could affect the mobile overflow test (`mobile.spec.js:24`), verify `body.scrollWidth <= viewport + 1` won't fail
- CI runs: `npm audit` → `tsc --noEmit` → `npm run build` → `npm run test:unit` → `npx playwright test` (see `.github/workflows/ci.yml`)
- **Local quick-check**: Use `npm run check` (runs `tsc --noEmit` + mobile build only — fast, no Next.js SSG). Use this instead of `npm run build` in Cowork/Claude Code sessions to avoid timeouts.

## #14: CROSS-PLATFORM DATA CONSISTENCY
**Event dates, times, titles, and details MUST be updated across ALL THREE platforms in one pass:**
1. **Landing page**: `Events.tsx`, `Schedule.tsx`, `layout.tsx` (JSON-LD)
2. **Dashboard**: `data.ts` (DEFAULT_EVENTS)
3. **Mobile PWA**: `index.html`, `events.js`, `booking.js`, `events-registration.js`, `admin.js`, `avatar.js`

Use grep to find all occurrences before editing. Verify 0 stale values remain after.

## #20: CROSS-PLATFORM CONSISTENCY — ALWAYS CHECK ALL THREE
**When making ANY change to one platform, ALWAYS ask: "Does this apply to the other platforms too?"**

The three platforms are:
1. **Dashboard** (React + Supabase Realtime in `store.tsx`)
2. **Mobile PWA** (vanilla JS + Supabase Realtime in `realtime-sync.js`)
3. **Mobile API** (Next.js API routes in `app/api/mobile/`)

**This applies to EVERYTHING, not just notifications:**
- UI/UX changes (e.g. new button on mobile → does dashboard need it too?)
- Bug fixes (e.g. fix on dashboard → does mobile have the same bug?)
- Feature additions (e.g. new feature on one platform → implement on all applicable platforms)
- Data format changes (e.g. new field in API → update both consumers)
- Styling changes (e.g. new color/theme → apply everywhere)
- Validation rules (e.g. input validation → same rules on all platforms)

**For notifications specifically, ALL of these must fire (where applicable):**
- Bell notification (insert into `notifications` table)
- Push notification (Web Push via `sendPushToUser()` or `/api/notify-message`)
- Nav bar badge update (bell badge + feature-specific badge like messages)
- Email notification (via `/api/booking-email` for bookings)

**For real-time visibility:**
- Both Dashboard and Mobile PWA subscribe to Supabase Realtime on key tables (bookings, messages, notifications, etc.)
- A DB write on ANY platform triggers live updates on ALL other platforms automatically
- Mobile PWA has 2-min heartbeat fallback if Realtime disconnects

**When making any change, always grep across all three codebases:**
1. `app/dashboard/` — Dashboard
2. `public/mobile-app/` — Mobile PWA
3. `app/api/mobile/` — Mobile API
4. Verify the change is consistent everywhere it applies

## #11: MAINTENANCE CONVENTIONS
- **Supabase schema**: `supabase/schema.sql` is the single source of truth. All DB changes go there FIRST, then apply to Supabase. No ad-hoc ALTER TABLEs.
- **DB migrations**: Use Supabase CLI for schema changes:
  1. Edit `supabase/schema.sql` first (source of truth)
  2. Run `npm run db:diff -- -f descriptive_name` to generate a migration file in `supabase/migrations/`
  3. Run `npm run db:push` to apply to remote DB
  4. Never run raw ALTER TABLE on production without a migration file
- **DB backups**: Run `npm run db:backup` before any schema migration. Requires `DATABASE_URL` in `.env.local` (see `.env.example`). Backups go to `backups/` (gitignored). Auto-prunes to 30 files. Set up cron for automated weekly backups (see `scripts/backup-db.sh` header for cron examples).
- **localStorage is a cache, not a source of truth**: Data flow is Supabase → localStorage → React state. New features must follow the same `store.tsx` pattern: optimistic update → Supabase write → rollback on failure.
- **E2E tests for new features**: Every new user-facing feature needs at least one Playwright happy-path test in `tests/`.
- **Test mocks must match real app code**: Before writing or updating test mocks, GREP the actual source code for the real localStorage keys, API endpoints, and DOM IDs. Never guess or assume. Recurring CI failures have been caused by: wrong localStorage key (`mtc-current-user` vs `mtc-user`), missing onboarding bypass (`mtc-onboarding-complete`), asserting on removed elements (`signupPassword`). Always verify mock data matches what the app actually reads.
- **Mobile PWA `dist/` is build output**: Never edit `dist/app.bundle.*` directly — edit source files in `css/` and `js/`, then run `npm run build:mobile`. The build script auto-bumps the SW cache version from content hash.
- **Cowork esbuild fix**: node_modules are installed on Windows. In Cowork (Linux VM), run `npm install @esbuild/linux-x64 --no-save` before `npm run build:mobile`.
- **Dependency updates**: Run `npm run deps:check` monthly to review outdated packages.

---

## #19: DEPLOYMENT IS RAILWAY — NOT VERCEL
**The production site is deployed on Railway. NEVER say Vercel.**
- Railway runs Next.js as a standard Node.js server (long-running process, NOT serverless)
- Environment variables (SMTP, Supabase, VAPID, etc.) are set in Railway dashboard
- NODE_VERSION=20 is set in Railway env vars
- `npm run build` then `npm start` — standard Next.js production server
- No vercel.json, no @vercel packages, no edge runtime

## #21: DASHBOARD MUTATIONS GO THROUGH API — NOT DIRECT SUPABASE
**All Dashboard (store.tsx) write operations MUST go through `/api/mobile/*` or `/api/dashboard/*` API routes.**
- API routes use the admin Supabase client (bypasses RLS) — no more silent failures from missing policies
- One codepath for both Dashboard and Mobile PWA = bugs fixed once, not twice
- Use the `apiCall()` helper in store.tsx for authenticated API calls
- `db.ts` fetch functions (SELECT) are OK to call directly — only mutations need routing
- `db.createNotification()` is OK — notifications has permissive INSERT policy
- If an API endpoint doesn't support the operation you need, extend the endpoint (don't bypass with direct Supabase)

## #22: ZERO TEST COVERAGE GAPS — UNIT, REGRESSION & FUZZING
**Every new feature, bug fix, or functionality change MUST include tests. No exceptions, no coverage gaps.**
- **Unit tests** (`unit-tests/`): Every new feature, API route change, or RPC function gets unit tests covering happy path + edge cases
- **Regression tests**: Every bug fix gets a regression test proving the bug stays fixed
- **Fuzzing tests**: For input-handling code (API routes, form validation, sanitization), add fuzz-style tests with malformed/boundary inputs
- **E2E tests** (`tests/`): New user-facing features get at least one Playwright happy-path test
- Suggest and write tests proactively — don't wait to be asked
- Tests run on **GitHub Actions CI** (not Claude tokens) — cost is zero, so write as many as needed
- If you can't run the test (e.g. no Playwright browsers in Cowork), still write the test file and note in MEMORY.md
- Current baseline: **1079 tests across 35 files** — never let this number go down

## #23: MIGRATIONS — ALWAYS PRINT THE SQL
**When creating a DB migration, ALWAYS print the full SQL in the chat so the user can paste it into the Supabase SQL Editor.**
- Don't just say "run the migration" or "use `npm run db:push`" — the user pastes SQL manually.
- Print the SQL as a code block right in the response.
- Still create the migration file in `supabase/migrations/` for version control.

## #24: APPLE/SAFARI TESTING — WEBKIT IN PLAYWRIGHT
**All changes must be tested against Safari/WebKit, not just Chromium.**
- **Playwright WebKit** is the primary tool for catching Safari bugs. CI runs 5 WebKit projects: iPhone SE, iPhone 14, iPad Mini, iPad Pro 11", mobile PWA on WebKit.
- **Device matrix**: iPhone SE (375x667), iPhone 14 (390x844), iPad Mini (744x1133), iPad Pro 11" (834x1194), iPad Pro 12.9" (1024x1366)
- **CSS rules**: Always use `-webkit-backdrop-filter` alongside `backdrop-filter`. Always provide `dvh` fallback chain (`100%` → `-webkit-fill-available` → `100dvh`). Tablet breakpoint starts at `744px` (iPad Mini), not `768px`.
- **Auth**: Email + 6-digit PIN. No Google OAuth, no magic link, no Supabase Auth. See MEMORY.md "Auth System — PIN-Based" for full plan.
- **Safe-area-insets**: All screens must respect `env(safe-area-inset-*)` for notch, Dynamic Island, and home indicator.
- **User tests on real devices**: iPad Mini 5th gen (2019), iPhone SE 2nd gen (2020).

## #25: NEVER USE THE USER'S PERSONAL EMAIL FOR TESTING
See rule at the TOP of this file — duplicated here for grep-ability. **USE `test@example.com` or `testuser@mtc.ca`. NEVER the user's real email.**

## #26: NEVER MIX PLATFORM THEME COLORS
**Each platform has its own color palette. NEVER use colors from one platform in another.**
- **Landing page / Info pages**: `#1a1f12` bg, `#6b7a3d` olive, `#d4e157` accent, `#e8e4d9` cream text, `#faf8f3` card bg
- **Dashboard**: Same olive/cream palette as landing page — `#6b7a3d`, `#d4e157`, `#1a1f12`, `#e8e4d9`, `#faf8f3`
- **Mobile PWA**: Different palette — `#c8ff00` neon lime, `#ff5a5f` coral, `#00d4ff` cyan, `#0a0a0a` dark
- **Rule**: Dashboard components must NEVER use mobile PWA colors (`#c8ff00`, `#ff5a5f`, `#00d4ff`, etc.) and vice versa
- **Incident**: Mar 14, 2026 — OnboardingTour.tsx had mobile PWA colors (neon lime, coral, cyan) mixed into dashboard olive theme. Looked terrible.

## #27: BDG RECONNECTION — NEVER USE switch_browser
**When BDG (Claude in Chrome) disconnects, NEVER use `switch_browser` tool.** It triggers a Windows popup that always errors out.
- **Instead**: Ask the user to click the Claude extension icon in Chrome and hit "Connect"
- Or just retry `tabs_context_mcp` — the user will reconnect on their end
- `switch_browser` has NEVER worked. Don't try it.

## #28: EVERY CODE CHANGE MUST UPDATE AFFECTED TESTS
**When removing, renaming, or changing ANY HTML element, JS function, CSS class, API endpoint, or DOM ID — IMMEDIATELY grep ALL THREE test directories for references and update them in the same pass.**
- **MANDATORY grep checklist** (run ALL three, not just one):
  1. `grep -r "searchTerm" unit-tests/` — Vitest unit tests
  2. `grep -r "searchTerm" tests/` — Playwright E2E tests
  3. `grep -r "searchTerm" mobile-app-tests/` — Mobile PWA tests
- Removing a DOM element (e.g. `#signupCard`)? Grep tests for `signupCard`, `signupPin`, etc. and update/remove assertions.
- Renaming a function or ID? Find-and-replace in tests too.
- Changing slide count, element count, or text content? Update any assertions that check those values.
- **Do this BEFORE saying "done"** — not as a follow-up after CI fails.
- **Incident log**: Mar 15, 2026 — signup card removed from mobile PWA but `pin-auth.test.js` (unit) AND `mobile-pwa.spec.js` (E2E) still asserted signup elements existed → CI broke TWICE. First fix only caught unit tests, missed E2E. Always grep all three directories.

## PROJECT OVERVIEW
- **Mono Tennis Club** — Next.js 14 + TypeScript (strict mode) + Tailwind CSS monorepo
- **Deployment**: Railway (standard Node.js server) — NOT Vercel, NOT serverless
- Tennis club management for Mono Tennis Club, Ontario
- PWA-ready with manifest.json
- Mobile PWA (vanilla JS SPA) merged into monorepo at `public/mobile-app/`

## ARCHITECTURE
- Landing page: `app/(landing)/page.tsx` with React components, ErrorBoundary
- Signup page: `app/signup/page.tsx` — dedicated signup wizard (extracted from MembershipTab)
- Dashboard PWA: `app/dashboard/` (componentized: Sidebar, DashboardHeader, WeatherWidget, etc.)
- Mobile PWA: `public/mobile-app/` (vanilla JS SPA, served as static files at `/mobile-app/index.html`)
- Mobile auth: `app/api/mobile-auth/route.ts` (validates via Supabase + demo fallback)
- Login: `app/login/page.tsx` (demo credentials gated behind NODE_ENV=development)
- Root route `/` serves landing page via Next.js App Router
- Service worker: `public/sw.js` (desktop), `public/mobile-app/sw.js` (mobile, scoped)
- Sitemap: `app/sitemap.ts` (dynamic XML)

## DESIGN SYSTEM
- Dark green theme: #1a1f12 bg, #6b7a3d and #d4e157 accents, #e8e4d9 light text
- Gotham Rounded Medium for headlines only (`headline-font` class), Inter for everything else (body font set on `<body>`)
- Tailwind CSS with custom components
- Glass morphism, parallax, texture overlays, confetti effects
- Mobile-first design

## LANDING PAGE SECTION ORDER
1. Hero (parallax bg, glass buttons, scroll-down indicator)
2. Wave Divider (hero → cream, overlapping)
3. Events & Programs (// Featured Events label, filter tabs, 3D hover cards)
4. Schedule / Calendar (dark bg, "Club's Calendar", month grid, event dots)
5. Partners (imgur logos)
6. Gallery (carousel + lightbox, 15 photos)
7. Wave Divider (gallery → footer)
8. Footer (watermark)
+ Booking Overlay (modal, hidden by default)
Note: Sections 3→4→5→6 meet flush (no wave dividers between them)

## /INFO PAGE TABS
- `/info?tab=about` — About Us (images, text, amenity tags)
- `/info?tab=membership` — Membership fees, facilities, news (default). Signup wizard extracted to `/signup`
- `/info?tab=coaching` — Mark Taylor's classes, summer camps, dashboard enrollment link
- `/info?tab=faq` — FAQ accordion + Google Maps
- `/info?tab=rules` — Constitution articles, regulations
- `/info?tab=privacy` — Privacy policy (PIPEDA)
- `/info?tab=terms` — Terms of service

## KEY FILES
- `app/layout.tsx` - Root layout (fonts, PWA meta tags, OG/Twitter/JSON-LD SEO, service worker)
- `app/(landing)/page.tsx` - Landing page root
- `app/(landing)/layout.tsx` - Landing layout (SEO metadata, JSON-LD, ErrorBoundary)
- `app/(landing)/components/` - All landing page components
- `app/(landing)/styles/landing.css` - Landing page CSS
- `app/sitemap.ts` - Dynamic XML sitemap
- `app/dashboard/` - Dashboard PWA (layout, components, lib/store)
- `app/dashboard/components/ErrorBoundary.tsx` - React error boundary
- `app/dashboard/book/components/` - Extracted booking components (Modal, Sidebar, Legend, Success, utils)
- `app/dashboard/lib/db.ts` - Supabase database functions
- `app/dashboard/lib/store.tsx` - State management (all mutations have error toasts + rollback)
- `app/api/mobile-auth/route.ts` - Mobile PWA auth endpoint
- `app/signup/page.tsx` - Dedicated signup wizard (extracted from MembershipTab)
- `app/dashboard/components/MobileAppBanner.tsx` - Dismissible "Try MTC Court App" banner
- `app/globals.css` - Global styles (@font-face after @tailwind directives)
- `supabase/schema.sql` - Full DB schema (18+ tables, indexes, RPC functions, triggers)
- `supabase/config.toml` - Supabase CLI config (migrations, local dev)
- `supabase/migrations/` - DB migration files (baseline + incremental)
- `scripts/backup-db.sh` - DIY database backup script (pg_dump + gzip + auto-prune)
- `app/api/mobile/types.ts` - Shared TypeScript interfaces for mobile API routes
- `app/api/mobile/auth-helper.ts` - Shared auth, rate limiting, sanitization, and withAuth wrapper
- `public/sw.js` - Service worker (desktop)
- `public/mobile-app/` - Mobile PWA (merged from mtc-app repo)
- `public/manifest.json` - PWA manifest
- `next.config.js` - Routes config, CSP, mobile-app SW headers
- `mobile-app-tests/` - Mobile PWA E2E + unit tests
- `scripts/build-mobile.js` - Mobile PWA build pipeline (concat + minify + auto SW cache bump)
- `playwright.config.js` - E2E test config
- `vitest.config.js` - Unit test config

## #29: ALWAYS USE QMD BEFORE READING FILES
**Before reading files or exploring directories, always use qmd to search for information first.**
- Available tools (via MCP):
  - `qmd search "query"` — fast BM25 keyword search (use 80% of the time)
  - `qmd vsearch "query"` — semantic vector search (finds conceptually related content)
  - `qmd query "query"` — hybrid search with reranking (best quality, slower)
  - `qmd get <file>` — retrieve a specific document by path
- Use `qmd search` for quick lookups when you know the terms (e.g. "booking validation", "PIN auth")
- Use `qmd query` for complex questions where you need the most relevant results
- Use Read/Glob/Grep only if qmd doesn't return enough results
- **Keep index updated**: Run `qmd update` at the START of every session (first command). Also run after any batch of file changes (new files, renames, deletions). This is fast (~1-2 seconds) and ensures search results are current.
- **Windows note**: `qmd` runs via PowerShell alias (`bun` wrapper). MCP config uses bun directly (see `~\.claude\mcp.json`).
- **Cowork VM resets every session** — qmd must be reinstalled each time. Run this as the very first Bash command in every Cowork session:
  `export PATH="$HOME/.bun/bin:$PATH" && bun install -g https://github.com/tobi/qmd && cd ~/.bun/install/global/node_modules/@tobilu/qmd && bun install @types/node --no-save && bun run build && cd - && qmd update`

---

*Keep this file SHORT. Don't add a new rule for every mistake - check if an existing rule covers it.*
