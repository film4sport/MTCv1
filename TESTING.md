# MTC Testing Guide

Welcome to the Mono Tennis Club app testing! This guide covers everything you need to test.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Member | member@mtc.ca | member123 |
| Coach | coach@mtc.ca | coach123 |
| Admin | admin@mtc.ca | admin123 |

**Start with Member**, then test Coach and Admin.

---

## Testing Order

### 1. Landing Page (/)
- [ ] Loading screen shows MTC logo + tennis ball bounce-away
- [ ] Hero section loads with parallax background
- [ ] Navbar logo (white) visible, sticky on scroll
- [ ] Nav links work: Home, About, Membership, FAQ, Login
- [ ] "Become a Member" button goes to /info?tab=membership
- [ ] "Member Login" button goes to /login
- [ ] Scroll down to Events & Programs section — 3D hover cards
- [ ] Club Calendar — navigate to May, click a day with dots, see events + RSVP links
- [ ] Calendar legend shows colored dots (social, match, tournament, camp, special)
- [ ] Partners section — logos hover lift
- [ ] Gallery — carousel works, click photo to open lightbox
- [ ] Back-to-top button appears on scroll
- [ ] Mobile: hamburger menu opens/closes, all links work

### 2. Info Page (/info)
- [ ] Tab navigation: About, Membership, Coaching, FAQ, Rules
- [ ] **About tab** — images load, amenity tags, Board of Directors
- [ ] **Membership tab** — fee table, signup flow (5 steps)
  - Step 1: Select membership type
  - Step 2: Personal info + password (min 8 chars, uppercase, lowercase, number)
  - Step 3: Waiver & Acknowledgement (scroll both documents to bottom to enable "I Agree")
  - Step 4: E-transfer payment instructions
  - Step 5: Confirmation
- [ ] **Coaching tab** — Mark Taylor info, link to dashboard
- [ ] **FAQ tab** — accordion expand/collapse, Google Maps embed
- [ ] **Rules tab** — constitution articles, regulations

### 3. Login Page (/login)
- [ ] "MTC Court App" title has shimmer animation
- [ ] Phone mockup preview visible
- [ ] Login with demo credentials (see table above)
- [ ] Redirects to /dashboard after login

### 4. Dashboard — Member Role (member@mtc.ca)
**Sidebar Navigation:**
- [ ] Home, Book, Schedule, Partners, Events, Messages, Profile, Settings

**Home Page:**
- [ ] Welcome greeting (Good morning/afternoon/evening)
- [ ] Quick action cards visible
- [ ] MTC logo in header, bell + menu icons visible

**Book a Court:**
- [ ] Select a court (1-4)
- [ ] Navigate weeks with arrows
- [ ] Select a time slot
- [ ] Toggle "Add Guest" ($10 fee shown)
- [ ] Search and add participants (max 3)
- [ ] Confirm booking
- [ ] Participants shown as removable pills

**Schedule:**
- [ ] Your bookings appear in list
- [ ] Calendar view shows event dots
- [ ] Cancel a booking — confirmation modal appears (not browser alert)
- [ ] Cancelled booking notifies participants

**Partners:**
- [ ] Browse available partners
- [ ] Send partner request

**Events:**
- [ ] View club events
- [ ] RSVP / cancel RSVP
- [ ] Calendar shows event dots

**Messages:**
- [ ] View conversations
- [ ] Booking messages show "Add to Calendar" button
- [ ] "Add to Calendar" downloads .ics file

**Profile:**
- [ ] Name and email shown (read-only)
- [ ] Member info displayed

**Settings:**
- [ ] 6 notification toggles (Bookings, Events, Payments, Partners, Messages, Programs)
- [ ] Toggles persist after page reload
- [ ] Bell notifications respect toggle preferences

### 5. Dashboard — Coach Role (coach@mtc.ca)
- [ ] Sidebar shows: Home, Book, Schedule, Events, Coaching, Messages, Profile, Settings
- [ ] **No** Partners or Lessons in sidebar
- [ ] Coaching page — book lesson time slots

### 6. Dashboard — Admin Role (admin@mtc.ca)
- [ ] Everything Member sees, plus:
- [ ] **Admin Panel** — analytics, member management
- [ ] Pause/cancel member accounts
- [ ] Update gate code (notifies all members)
- [ ] Admin panel best viewed on desktop

---

## Things to Watch For
- **Images loading** — all images should load on first visit without hard refresh
- **Modals** — cancel booking uses custom modal, NOT browser confirm() dialog
- **Notifications** — booking a court notifies participants; cancelling also notifies
- **Responsive** — test on both mobile and desktop
- **Calendar** — recurring events only show May 9 (Opening Day) through October
- **Guest fee** — $10 shown when guest toggle is on

## Reporting Issues
Note the page, what you did, what you expected, and what happened. Screenshots help!
