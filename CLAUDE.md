# CLAUDE.md - MTC Landing Page Project Rules

## #1: FOLLOW WHAT WAS DECIDED
**If we already discussed and agreed on an approach, USE IT. Don't invent alternatives.**
- Before making ANY change, check: did we already decide how this should work?
- If yes → follow that decision exactly
- If no → ASK before choosing an approach
- If a fix fails → the decision was right, my implementation was wrong. Debug the implementation, don't change the approach.

## #2: ONLY CHANGE WHAT IS ASKED — ZERO EXTRAS
- **Before EVERY edit, ask yourself: "Did the user ask for this specific change?"** If NO → don't do it.
- If asked to fix 2 things, fix exactly those 2 things. Not 2 + 5 "improvements" you noticed.
- Necessary dependencies of the asked change are OK (e.g. bumping SW cache version when adding a new cached file). Refactors, cleanups, style tweaks, "while I'm here" changes are NOT OK.
- **DO proactively suggest** improvements — but ONLY as text suggestions. Never silently implement them.
- This rule exists because it has been violated repeatedly. When in doubt, DON'T touch it.

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
- CI runs: `npm run build` → `npm run test:unit` → `npx playwright test` (see `.github/workflows/ci.yml`)

## #14: CROSS-PLATFORM DATA CONSISTENCY
**Event dates, times, titles, and details MUST be updated across ALL THREE platforms in one pass:**
1. **Landing page**: `Events.tsx`, `Schedule.tsx`, `layout.tsx` (JSON-LD)
2. **Dashboard**: `data.ts` (DEFAULT_EVENTS)
3. **Mobile PWA**: `index.html`, `events.js`, `booking.js`, `events-registration.js`, `admin.js`, `avatar.js`

Use grep to find all occurrences before editing. Verify 0 stale values remain after.

## #11: MAINTENANCE CONVENTIONS
- **Supabase schema**: `supabase/schema.sql` is the single source of truth. All DB changes go there FIRST, then apply to Supabase. No ad-hoc ALTER TABLEs.
- **localStorage is a cache, not a source of truth**: Data flow is Supabase → localStorage → React state. New features must follow the same `store.tsx` pattern: optimistic update → Supabase write → rollback on failure.
- **E2E tests for new features**: Every new user-facing feature needs at least one Playwright happy-path test in `tests/`.
- **Mobile PWA `dist/` is build output**: Never edit `dist/app.bundle.*` directly — edit source files in `css/` and `js/`, then run `npm run build:mobile`. The build script auto-bumps the SW cache version from content hash.
- **Dependency updates**: Run `npm run deps:check` monthly to review outdated packages.

---

## PROJECT OVERVIEW
- **Mono Tennis Club** — Next.js 14 + TypeScript (strict mode) + Tailwind CSS monorepo
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
- `public/sw.js` - Service worker (desktop)
- `public/mobile-app/` - Mobile PWA (merged from mtc-app repo)
- `public/manifest.json` - PWA manifest
- `next.config.js` - Routes config, CSP, mobile-app SW headers
- `mobile-app-tests/` - Mobile PWA E2E + unit tests
- `scripts/build-mobile.js` - Mobile PWA build pipeline (concat + minify + auto SW cache bump)
- `playwright.config.js` - E2E test config
- `vitest.config.js` - Unit test config

---

*Keep this file SHORT. Don't add a new rule for every mistake - check if an existing rule covers it.*
