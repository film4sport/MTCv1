# MTC Tester Guide

## App URL
**https://your-railway-url.up.railway.app**

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Member | member@mtc.ca | member123 |
| Coach | coach@mtc.ca | coach123 |
| Admin | admin@mtc.ca | admin123 |

---

## What to Test

### 1. Landing Page (/)
- [ ] Loading screen appears then fades out
- [ ] Scroll down through all sections: Hero, Events, Calendar, Partners, Gallery, Footer
- [ ] Click "Become a Member" in hero — goes to /info?tab=membership
- [ ] Click "Member Login" — goes to /login
- [ ] Navbar sticks on scroll, links work (Home, About, Membership, FAQ, Login)
- [ ] Gallery carousel arrows + dots work, images load
- [ ] Calendar month navigation works
- [ ] Back-to-top button appears when scrolling down

### 2. Info Page (/info)
- [ ] All tabs load: About, Membership, Coaching, Rules, FAQ, Privacy, Terms
- [ ] Membership tab shows fee table and "Sign Up Now" button
- [ ] Coaching tab mentions Mark Taylor and links to "Lessons tab" in dashboard
- [ ] FAQ tab has accordion (click questions to expand) + Google Maps embed
- [ ] Rules tab has Constitution and Regulations sections

### 3. Signup Flow (/info?tab=membership > Sign Up Now)
- [ ] Step 1: Select membership type (Adult $100, Family $200, Student $50)
- [ ] Step 2: Enter name, email, password (must have 8+ chars, uppercase, lowercase, number)
- [ ] Step 3: Scroll through BOTH waiver AND acknowledgement to enable "I Agree"
- [ ] Step 4: E-transfer payment instructions shown
- [ ] Step 5: Confirmation — click "Go to Dashboard"
- [ ] Check Messages after signup — should have welcome message with gate code

### 4. Login (/login)
- [ ] Test account buttons fill in credentials
- [ ] Login redirects to /dashboard
- [ ] "Forgot password?" opens modal
- [ ] Wrong password shows error message

### 5. Member Dashboard (/dashboard)
- [ ] Home page shows greeting (Good morning/afternoon/evening)
- [ ] Weather widget loads
- [ ] Quick action cards: Book Court, View Schedule, Find Partner

#### Booking a Court (/dashboard/book)
- [ ] Court tabs (1-4) — click to switch
- [ ] If a court is closed by admin, tabs shows "Closed" and all slots show "Closed"
- [ ] Week view: navigate between weeks, see available/taken slots
- [ ] Click available slot — booking modal appears
- [ ] Toggle "Guest" — $10 fee shown, guest name field appears
- [ ] Search participants (type 2+ chars) — member dropdown appears
- [ ] Add up to 3 participants (shown as pills, removable)
- [ ] Confirm booking — success modal, slot turns green "Booked"
- [ ] Cancel booking — click your booking, confirm cancellation

#### Schedule (/dashboard/schedule)
- [ ] "My Bookings" tab shows your bookings
- [ ] "Club Calendar" tab shows month view with event dots
- [ ] List/Calendar toggle works

#### Partners (/dashboard/partners)
- [ ] Skill level filter buttons work
- [ ] Request partner button works

#### Events (/dashboard/events)
- [ ] Shows club events (Opening Day BBQ, etc.)
- [ ] RSVP button works

#### Lessons (/dashboard/lessons)
- [ ] Shows coaching programs/lessons

#### Messages (/dashboard/messages)
- [ ] Shows conversation list
- [ ] Click conversation to open thread
- [ ] Send a message — appears in thread
- [ ] Booking messages have "Add to Calendar" button

#### Profile (/dashboard/profile)
- [ ] Shows your name, email, membership type, NTRP rating

#### Settings (/dashboard/settings)
- [ ] 6 notification toggles (persist when you leave and come back)
- [ ] Privacy Policy and Terms links work
- [ ] Sign Out button works

#### Notifications (bell icon)
- [ ] Bell icon in header shows unread count
- [ ] Click to see notification dropdown
- [ ] "Mark all read" clears the badge

### 6. Admin Dashboard (login as admin@mtc.ca)

#### Admin Panel (/dashboard/admin)
- [ ] 4 tabs: Dashboard, Members, Courts, Announcements
- [ ] Dashboard tab: analytics cards (bookings, revenue, peak times, court usage)
- [ ] Gate code card: current code shown, update + notify all members

#### Members Tab
- [ ] Member list with search
- [ ] Status badges (Active/Paused)
- [ ] Pause member — member sees "Membership Paused" screen
- [ ] Reactivate member — member can access dashboard again
- [ ] Cancel member — account deleted (careful, this is permanent)

#### Courts Tab
- [ ] Court cards with Active/Closed status
- [ ] "Close Court" button — court becomes closed
- [ ] "Reopen Court" button — court becomes active again
- [ ] Verify: after closing a court, go to Book page — that court's slots should all show "Closed"

#### Announcements Tab
- [ ] Create announcement (title + body)
- [ ] Announcement shows on member's dashboard home
- [ ] Delete announcement

### 7. Coach Dashboard (login as coach@mtc.ca)
- [ ] Sidebar shows "Book Lessons" instead of "Partners"
- [ ] Book Lessons (/dashboard/coaching): can book lesson slots on courts
- [ ] My Lessons tab shows coach's booked lessons
- [ ] Booked lessons show as blocked "Lesson" slots on member's booking page

### 8. Cross-Role Data Sync
- [ ] Admin creates announcement — member sees it on dashboard (after refresh)
- [ ] Admin updates gate code — member receives notification + message
- [ ] Member books court — other members see slot as "Taken"
- [ ] Coach books lesson — members see slot as "Lesson" (blocked)
- [ ] New signup gets welcome message with gate code

---

## Known Limitations
- No live push updates — if admin posts while you're logged in, refresh to see changes
- Profile NTRP rating is display-only (not editable yet)
- No "forgot password" email sending yet (modal exists but emails not configured)
- Payment is e-transfer only (tracked outside the app)

## Reporting Bugs
Please report any issues with:
1. What you were trying to do
2. What happened instead
3. Screenshot if possible
4. Browser + device info
