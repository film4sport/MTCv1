# May 9 Launch Checklist

Keep this simple. If these flows work, members will feel the app works.

## Critical Flows

- [ ] Login works on desktop
- [ ] Login works on mobile PWA
- [ ] PIN reset works
- [ ] Book a court works
- [ ] Add participants works
- [ ] Booking email/message/push notifications work
- [ ] Messaging works
- [ ] Find partners works
- [ ] Partner notifications work
- [ ] RSVP to events works
- [ ] RSVP notifications work
- [ ] Admin announcements work
- [ ] Notification settings are respected
- [ ] Admin can fix mistakes fast

## What To Test

### 1. Login
- [ ] Member can log in on desktop
- [ ] Member can log in on mobile app
- [ ] Bad PIN shows a clear error
- [ ] Logout works
- [ ] Session survives page refresh

### 2. PIN Reset
- [ ] Member can request reset code
- [ ] Reset email arrives
- [ ] Code works
- [ ] New PIN works right away

### 3. Booking
- [ ] Member can book a court
- [ ] Correct court/date/time is saved
- [ ] Double-click does not create duplicate bookings
- [ ] Member can cancel a booking

### 4. Participants
- [ ] Booker can add participants
- [ ] Participant names are saved correctly
- [ ] All affected users get the right email/message/push

### 5. Messaging
- [ ] Member can start a conversation
- [ ] Member can send a message
- [ ] Other member can see it
- [ ] Read state updates correctly
- [ ] In-app notification appears if expected
- [ ] Push notification appears if enabled

### 6. Partners
- [ ] Member can post a partner request
- [ ] Other member can see it
- [ ] Match/join flow works
- [ ] Notifications are sent
- [ ] Notification settings are respected

### 7. Events / RSVP
- [ ] Member can RSVP
- [ ] RSVP state sticks after refresh
- [ ] Counts/attendees update correctly
- [ ] Notifications are sent if expected
- [ ] Notification settings are respected

### 8. Admin Announcements
- [ ] Admin can create an announcement
- [ ] Announcement appears in app
- [ ] In-app notification is created if expected
- [ ] Push notification is sent to opted-in users
- [ ] Users with notifications turned off do not get push
- [ ] App still works if push/email fails

### 9. Notification Delivery / Settings
- [ ] Push toggle in settings actually changes behavior
- [ ] In-app notification toggle actually changes behavior
- [ ] Email toggle actually changes behavior
- [ ] Only the right users receive notifications
- [ ] No duplicate notifications are created

### 10. Admin Safety Net
- [ ] Admin can find a member
- [ ] Admin can block a court
- [ ] Admin can remove/fix a bad booking
- [ ] Admin can post announcements

## Launch Rule

If any critical flow is broken, fix that before doing cleanup/refactors.

## Nice To Have Later

- Cleaner file structure
- Smaller giant files
- More polish
- More automation
