# Plan: Mobile Admin Bug Fix + Dashboard Member List Improvements

## Task 1: Fix Mobile PWA "Admin access required" Bug

### Root Cause
Two issues combine to create this bug:

1. **CSS in lazy-loaded bundle**: The `.menu-item.admin-hidden { display: none; }` rule lives in `admin.css`, which is lazy-loaded only when navigating to the admin panel. On page load, this CSS doesn't exist, so the `admin-hidden` class is a no-op — the admin menu item is **visible to ALL users** (members, guests, everyone).

2. **Missing admin menu logic for returning users**: `interactive.js` loads users from localStorage on page reload but does NOT call `completeLogin()`, so the admin menu item's visibility is never toggled programmatically. Combined with bug #1, the menu item stays visible.

Result: A non-admin user (or an admin whose localStorage role got stale) sees "Admin Panel" in the hamburger menu, clicks it, and gets the "Admin access required" toast because the runtime role check in `navigation.js` correctly blocks them.

### Fix (2 files)
1. **Move `.admin-hidden` CSS** from `css/admin.css` to `css/menu-notifications.css` (always loaded). This ensures the menu item is hidden by default for everyone, and only shown when `completeLogin()` removes the class.

2. **Add admin menu visibility logic to `interactive.js`**: After loading user from localStorage (line ~73), also show/hide the admin menu item based on `currentUser.role` — same logic as `completeLogin()` in auth.js.

---

## Task 2: Dashboard Admin Member List — Minimal Redesign

### Current State
- 10-column wide table (Name, Email, Role, Membership, Skill, Team, Residence, Status, Since, Actions)
- Horizontal scroll required on smaller screens
- Search bar + Team filter + Residence filter
- All info shown at once — dense, hard to scan

### Proposed Changes

**A. Condensed card-row layout** — Replace the wide table with compact rows that show the most important info at a glance:
- **Primary line**: Avatar + Name + Role badge + Status dot
- **Secondary line**: Email + Membership type + Skill level + Team
- **Expand on click**: Shows full details (residence, member since, actions)
- This eliminates horizontal scrolling and makes scanning much faster

**B. Summary stats bar** at the top:
- Total members, Active, Paused, Mono residents, Out of Town
- Quick visual overview before diving into the list

**C. Enhanced filters** — Add:
- **Status filter**: All / Active / Paused
- **Role filter**: All / Members / Coaches / Admins
- **Skill filter**: All / Beginner / Intermediate / Advanced / Competitive
- Keep existing: Search, Team, Residence
- Use compact filter chips instead of separate button rows

**D. Sortable** — Click column headers (or sort dropdown) to sort by: Name, Role, Skill, Status, Member Since

### Files to Edit
- `app/dashboard/admin/components/AdminMembersTab.tsx` — Main rewrite
- `app/dashboard/admin/page.tsx` — No changes needed (actions stay here)
