# LeagueFindr Dashboard UI/UX Fixes

## Test Credentials
- **Admin:** admin@leaguefindr.com / pB7-aKZ$kjFgvN8
- **Organizer/League Manager:** organizer@leaguefindr.com / sPp:%m_n9Jqm!QA

---

## Both Admin and League Manager

- [ ] Change dashboard title to "LeagueFindr Dashboard" with logo
- [ ] Add welcome message showing "Welcome, {email}" on login
- [ ] Show progress spinner wheel while loading on login
- [ ] Add "Cursor:Pointer" CSS on hover of any clickable buttons

---

## Admin Side

### General Dashboard
- [ ] Show ORG ID in Organization table with copy button
- [ ] Add tabs for "Drafts" and "Templates"
- [ ] Add views for "Sport", "Venue", and "Organization" tables in dashboard
- [ ] Add sortable columns - Status, Start Date, and Submitted Date (at minimum)
- [ ] Change footer copyright to "Recess Sports dba LeagueFindr"
- [ ] Add full footer with navigation links to main LeagueFindr website

### Add Sport
- [ ] Add error text for a sport that already exists
- [ ] Disable Add Sport button when sport already exists

### Add Venue
- [ ] BUG FIX: Fix issue where selecting address closes pop-up

### Add Organization
- [ ] Fix spacing/styling of pop-up (Org Name field cut off on desktop)
- [ ] Make Website URL and Email Address required fields

### Add League
- [ ] Show "Draft Name" field only after user clicks "Save Draft"
- [ ] Fix JSON parsing error when creating league ("Unexpected token 'u', "user does "...")
- [ ] Improve error messaging for invalid sport names (how does user know sport doesn't exist?)
- [ ] Verify optional vs required fields and ensure submissions are going through
- [ ] Remove "Submitted Leagues" section at bottom of table

---

## League Manager Side

### General Dashboard
- [ ] Implement duplicate organization check (name, email, URL) when creating organization
- [ ] Add error message directing users to info@leaguefindr.com for duplicate organizations
- [ ] Add dashboard home button instead of relying on breadcrumbs
- [ ] Hide delete Org button (use 3-dot menu or hide in Edit feature)
- [ ] Add "+" icon next to "Submit League" button
- [ ] Make Template and Drafts buttons secondary button style
- [ ] Display count of submitted leagues, drafts, and templates
- [ ] Remove Leagues page from League Organizer flow
- [ ] Clicking Organization from Dashboard should show league list immediately (no extra click)

### Create Organization
- [ ] Update Organization Website field to accept non-www and non-https:// formats

### Create League
- [ ] Fix JSON parsing error when creating first league entry ("Unexpected token 'i', "invalid se"...")
- [ ] Enable users to "Save as Draft" AND "Save as Template" in Submit League flow

---

## Final Step
- [ ] Delete this file (UI_UX_FIXES.md) once all fixes have been completed
