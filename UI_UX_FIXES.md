# LeagueFindr Dashboard UI/UX Fixes

## Both Admin and League Manager

- [x] Change dashboard title to "LeagueFindr Dashboard" with logo
- [x] Add welcome message showing "Welcome, {email}" on login
- [x] Show progress spinner wheel while loading on login
- [x] Add "Cursor:Pointer" CSS on hover of any clickable buttons (all table headers and interactive elements have cursor-pointer class)

---

## Admin Side

### General Dashboard

- [x] Show ORG ID in Organization table with copy button
- [x] Add tabs for "Drafts" and "Templates"
- [x] Add views for "Sport", "Venue", and "Organization" tables in dashboard
- [x] Add sortable columns - Status, Start Date, and Submitted Date (at minimum)
- [x] Change action buttons order to League, Organization, Venues, Sports
- [x] Change tab order to Awaiting Changes, Leagues, Organizations, Venues, Sports, Templates/Drafts
- [x] Reduce horizontal padding on main content container
- [x] Make organization autocomplete height dynamic based on results
- [x] View button on leagues table now shows AdminAddLeagueForm with pre-populated organization
- [x] View button on drafts/templates table now shows dropdown menu with edit form
- [x] Drafts/Templates can be edited and saved with three options: Save as Draft, Update Template, Submit League
- [x] Pre-populated sport and venue fields no longer show autocomplete dropdowns
- [x] Change footer copyright to "Recess Sports dba LeagueFindr"
- [x] Add full footer with navigation links to main LeagueFindr website

### Add Sport

- [x] Add error text for a sport that already exists
- [x] Disable Add Sport button when sport already exists

### Add Venue

- [x] BUG FIX: Fix issue where selecting address closes pop-up

### Add Organization

- [x] Fix spacing/styling of pop-up (Org Name field cut off on desktop)
- [x] Make Website URL and Email Address required fields

### Add League

- [x] Show "Draft Name" field only after user clicks "Save Draft"
- [x] Admin view form uses Supabase readonly data instead of API calls
- [x] Admin form organization pre-population no longer triggers 401 errors
- [x] Fix JSON parsing error when creating league ("Unexpected token 'u', "user does "...")
- [x] Improve error messaging for invalid sport names (how does user know sport doesn't exist?)
- [x] Verify optional vs required fields and ensure submissions are going through
- [x] Remove "Submitted Leagues" section at bottom of table

---

## League Manager Side

### General Dashboard

- [x] Implement duplicate organization check (name, email, URL) when creating organization
- [x] Add error message directing users to <info@leaguefindr.com> for duplicate organizations
- [ ] Add dashboard home button instead of relying on breadcrumbs
- [x] Hide delete Org button (use 3-dot menu or hide in Edit feature)
- [x] Add "+" icon next to "Submit League" button
- [ ] Make Template and Drafts buttons secondary button style
- [x] Display count of submitted leagues, drafts, and templates
- [x] Remove Leagues page from League Organizer flow
- [x] Clicking Organization from Dashboard should show league list immediately (no extra click)

### Create Organization

- [x] Update Organization Website field to accept non-www and non-https:// formats

### Create League

- [x] Fix JSON parsing error when creating first league entry ("Unexpected token 'i', "invalid se"...)
- [x] Enable users to "Save as Draft" AND "Save as Template" in Submit League flow
- [x] Allow organizers to save submitted leagues as drafts or templates

---

## Final Round UAT - Remaining Items

### Admin Side - Tab & Button Ordering
- [x] Reorder tabs to: Awaiting, Leagues, Organizations, Venues, Sports, Templates
- [x] Reorder buttons to: Leagues, Organizations, Venues, Sports

### Admin Side - Additional Fixes Needed
- [ ] Add "Status" filter for league filtering
- [ ] Add sort columns functionality for league managers (same as admin)
- [ ] Handle unrecognized sports in league submission (Foozball issue) - sport field remains empty
- [ ] Show Game Occurrences in 12-hour format with AM/PM instead of military time

### League Manager Side - Tab & Button Reordering
- [x] Remove Leagues page from League Organizer flow
- [x] Clicking Organization from Dashboard shows league list immediately
- [x] Reorder tabs to: Submitted Leagues, Templates
- [x] Add buttons: Create Template, Submit League

### League Manager Side - Additional Fixes Needed
- [ ] Add "Status" filter for league filtering
- [ ] Add sort columns functionality (same as admin)
- [ ] Make Template and Drafts buttons secondary button style
- [x] Remove "Submitted Leagues" text at bottom of table

### Both Admin and LM - Template & Draft Flow
- [ ] Form title for Create Template should say "Create Template"
- [ ] Form subtitle should say "Create a new league template. Use this as a starting point for future league submissions."
- [ ] Hide the "Submit League" button in Create Template flow
- [ ] Remove "Your league submission will be reviewed by an admin before appearing on the map." text from Create Template
- [ ] Unify "Save as Draft" and "Save as Template" UX - show modal popup with name input field
- [ ] Both buttons should function the same way - clicking either shows popup with "Save" and "Cancel" buttons

### Both Admin and LM - Submit League Form Reorganization
- [ ] Make Venue a required field
- [ ] Reorganize form sections to:
  - **Sport and League Information** (League Name, Sport, Gender, Skill Level, Minimum Team Players, Website Registration URL)
  - **Season Dates** (Registration Deadline, Season Start Date, Season End Date - optional)
  - **Venue** (Venue Name, Venue Address with ADD NEW functionality)
  - **Game Schedule** (Day - dropdown for weekdays, Earliest Start Time, Latest End Time, "Add to Game Schedule" button on same line)
  - **Pricing** (Pricing Strategy, Cost Per Person / Team Cost, Per Game Team Fee - optional)
  - **Additional Information** (Season Details - optional)
- [ ] Change button text at bottom from "Continue to Save as Template" to "Save as Template"
- [ ] Add "+" icon for ADD NEW Venue functionality (seamless experience)

### Remaining Bug Fixes
- [ ] Organization deletion not working - fix error message
- [ ] Duplicate Org check error message - show proper message directing to info@leaguefindr.com (currently shows "body stream already read" error)
- [ ] Website URL field in Add League Form - don't require "https://" prefix
- [ ] Add back to dashboard button instead of just breadcrumbs
- [ ] Email Address should be required field in Add Organization form

### Footer Updates
- [ ] Replace fake footer links (Features, Contact) with actual website links to LeagueFindr website
- [ ] Add easy way to navigate back to main website from dashboard

---

## Final Step

- [ ] Delete this file (UI_UX_FIXES.md) once all fixes have been completed
