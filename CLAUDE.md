# CLAUDE.md - MTC Landing Page Project Rules

## #1: FOLLOW WHAT WAS DECIDED
**If we already discussed and agreed on an approach, USE IT. Don't invent alternatives.**
- Before making ANY change, check: did we already decide how this should work?
- If yes → follow that decision exactly
- If no → ASK before choosing an approach
- If a fix fails → the decision was right, my implementation was wrong. Debug the implementation, don't change the approach.

## #2: DO EXACTLY WHAT'S ASKED — NOTHING MORE
- Did user EXPLICITLY ask for this change? If not, DON'T DO IT
- Don't "helpfully" add related things
- **MINIMAL DIFF**: If asked to change ONE property, change ONLY that property. Don't touch surrounding values (positions, sizes, colors) unless explicitly told to.
- If I think something else would be nice → ASK first

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

## #7: NO CLUBSPARK LINKS
All external links to clubspark.ca have been removed. ClubSpark was only used as an info source. Replace with on-page anchors (#faq, #events, #schedule, #directions) or booking overlay triggers.

## #8: ALWAYS UPDATE CLAUDE.md
When new project rules or conventions are established, add them to this file AND MEMORY.md.

---

## PROJECT OVERVIEW
- **Mono Tennis Club** - Next.js 14 + TypeScript + Tailwind CSS web app
- Tennis club management for Mono Tennis Club, Ontario
- PWA-ready with manifest.json

## ARCHITECTURE
- Landing page: `app/(landing)/page.tsx` with React components (migrated from static HTML)
- Mobile PWA: `app/app/page.tsx` (~7234 lines single component)
- Login: `public/login.html` (static)
- Root route `/` serves landing page via Next.js App Router

## DESIGN SYSTEM
- Dark green theme: #1a1f12 bg, #6b7a3d and #d4e157 accents, #e8e4d9 light text
- Gotham Rounded font for headlines, Inter for body
- Tailwind CSS with custom components
- Glass morphism, parallax, texture overlays, confetti effects
- Mobile-first design

## LANDING PAGE SECTION ORDER
1. Hero (parallax bg, glass buttons, scroll-down indicator)
2. Wave Divider (hero → cream, overlapping)
3. Events & Programs (// Featured Events label, filter tabs, 3D hover cards)
4. Schedule / Calendar (dark bg, "Club's Schedule", month grid, event dots)
5. Partners (imgur logos)
6. Gallery (carousel + lightbox, 15 photos)
7. Wave Divider (gallery → footer)
8. Footer (watermark)
+ Booking Overlay (modal, hidden by default)
Note: Sections 3→4→5→6 meet flush (no wave dividers between them)

## /INFO PAGE TABS
- `/info?tab=about` — About Us (images, text, amenity tags)
- `/info?tab=membership` — Membership fees, facilities, news (default)
- `/info?tab=faq` — FAQ accordion + Google Maps

## KEY FILES
- `app/(landing)/page.tsx` - Landing page root
- `app/(landing)/components/` - All landing page components
- `app/(landing)/styles/landing.css` - Landing page CSS
- `app/app/page.tsx` - Mobile PWA
- `app/globals.css` - Global styles
- `next.config.js` - Routes config

---

*Keep this file SHORT. Don't add a new rule for every mistake - check if an existing rule covers it.*
