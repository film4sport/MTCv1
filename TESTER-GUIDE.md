# Mono Tennis Club — Tester Guide

## App URL
**https://mtcv1-production.up.railway.app**

> If a page looks stale or broken, do a hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac).

---

## Demo Accounts

| Role   | Email            | Password   | What you can do                              |
|--------|------------------|------------|----------------------------------------------|
| Member | member@mtc.ca    | member123  | Book courts, RSVP to events, message members |
| Coach  | coach@mtc.ca     | coach123   | Book lesson slots on courts                  |
| Admin  | admin@mtc.ca     | admin123   | Manage members, courts, announcements        |

---

## What to Test

### 1. Landing Page (no login needed)
- **URL:** `/`
- Scroll through the full page: Hero, Events, Calendar, Partners, Gallery, Footer
- Click "Become a Member" button in hero (should go to `/info?tab=membership`)
- Open the **Club Calendar** section, click on different days to see events and court bookings
- Click month arrows to navigate months
- Open the **Gallery** carousel, click photos to open lightbox
- Try the sticky navbar links (About, Membership, FAQ, Login)

### 2. Info Page (no login needed)
- **URL:** `/info`
- Test all tabs: About, Membership, Coaching, FAQ, Rules, Privacy, Terms
- **Membership tab:** Click "Become a Member" and go through the 5-step signup flow (don't submit — it creates a real account)
- **FAQ tab:** Expand/collapse questions, check the Google Maps embed
- **Coaching tab:** Should mention "Lessons" tab (not "Programs")

### 3. Member Dashboard
- **Login as:** `member@mtc.ca` / `member123`
- **Home:** Check welcome greeting, quick actions, weather widget
- **Book Court:** Select different courts (1-4), click an available slot to book, verify the booking appears in "My Schedule"
- **Book Court:** Try booking on a closed court (if admin has closed one) — it should show "Closed" and block booking
- **Guest booking:** Toggle "Bringing a Guest" when booking, enter a guest name
- **Participants:** Add other members to a booking — they should get a notification
- **Cancel booking:** Click on your own booking to cancel it (must be > 2 hrs before)
- **My Schedule:** See your upcoming bookings and club events
- **Partners:** Post a "looking for partner" request, browse others
- **Events:** RSVP to club events
- **Lessons:** View available coaching programs, enroll
- **Messages:** Send a message to another member
- **Profile:** View your profile info
- **Settings:** Toggle notification preferences, toggle haptic feedback on/off
- **Settings:** Try "Install MTC App" button — should show inline instructions (not a browser alert)
- **Refresh button:** Tap the refresh icon (↻) in the header to reload data from Supabase
- **Keyboard:** Press `Escape` to close any open modal or dialog

### 4. Coach Dashboard
- **Login as:** `coach@mtc.ca` / `coach123`
- **Book Lessons:** Select a court and time slot to book a lesson (blocks the slot for all members)
- Sidebar should show "Book Lessons" instead of "Partners" and "Lessons"

### 5. Admin Panel
- **Login as:** `admin@mtc.ca` / `admin123`
- **Dashboard tab:** View analytics cards, peak times, court usage, revenue breakdown, monthly trends
- **Dashboard tab:** Export CSV buttons (Bookings, Members, Revenue)
- **Dashboard tab:** Update the gate code — should send notification to all members
- **Members tab:** Search members, pause/reactivate/cancel a member
- **Courts tab:** Close a court (toggle button) — then switch to member account and verify court shows as "Closed" on booking page
- **Announcements tab:** Post a new announcement (info/warning/urgent), delete existing ones
- Note: **Payments tab was removed** — payments are e-transfers handled outside the app

### 6. Cross-Feature Tests
- Book a court as member, then check if it appears on the landing page calendar for that day
- Post an announcement as admin, then check if it shows as a banner in the member dashboard
- Pause a member as admin, then try logging in as that member (should see pause screen)
- Send a message with a booking link, verify the "Add to Calendar" button works

---

### 7. Mobile-Specific Tests
- **Haptic feedback** (Android only): Tap booking slots, RSVP buttons, send messages — should feel a light vibration
- Haptic can be disabled in **Settings → Preferences → Haptic Feedback**
- **Animations:** Empty states should animate in, partner cards should fade out on removal
- **Modals:** All modals should be scrollable on small screens

---

## Known Limitations
- **Profile NTRP rating** is hardcoded at 3.5 — editing not yet implemented
- **Signup flow** creates a real Supabase account — use test emails if testing signup
- **Weather widget** requires internet connection (Open-Meteo API)
- **Demo data** resets periodically — bookings you make may disappear
- **Haptic feedback** only works on Android Chrome — iOS Safari does not support the Vibration API

---

## Reporting Bugs
Please include:
1. **Which account** you were logged in as (member/coach/admin)
2. **What page** you were on (URL or page name)
3. **What you did** (step by step)
4. **What happened** vs. **what you expected**
5. **Browser** (Chrome, Safari, Firefox) and **device** (desktop/tablet/phone)
6. **Screenshot** if possible
