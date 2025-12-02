# Google Tag Manager Events Configuration for LeagueFindr

## Overview
This document lists all custom events that LeagueFindr sends to the dataLayer for Google Tag Manager (GTM) processing. Each event needs to be configured in GTM with appropriate triggers and tags.

**GTM Container ID:** `GTM-5NSHDJW4`

## How It Works
1. **Code** → pushes custom events to `window.dataLayer`
2. **GTM** → listens for these events via triggers
3. **GTM Tags** → forward events to Google Analytics 4

## Custom Events List

### Page Views & Entry Points

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `page_view_homepage` | None | User viewed homepage |
| `page_view_about_us` | None | User viewed about us page |
| `page_view_find_a_league` | None | User viewed find-a-league page |
| `page_view_league_detail` | `league_id`, `league_name`, `sport` | User viewed specific league detail |
| `page_view` | `page_path`, `page_title` | Generic page view for other pages |
| `entered_on_homepage` | None | User entered site on homepage |
| `entered_on_find_a_league_page` | None | User entered site on find-a-league page |
| `entered_on_league_info_page` | `league_id` | User entered site on league info page |

### Navigation & Menu

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `clicked_hamburger_menu_mobile` | None | User clicked mobile hamburger menu |
| `clicked_back_to_results_button_on_find_a_league_page` | None | User clicked back to results |

### CTA Buttons

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `clicked_sign_up_button_find_a_league_page` | `league_id`, `league_name`, `sport` | Sign up clicked on find-a-league page |
| `clicked_sign_up_button_league_info_page` | `league_id`, `league_name`, `sport` | Sign up clicked on league info page |
| `clicked_more_info_button_find_a_league_page` | `league_id`, `league_name`, `sport` | More info clicked on find-a-league page |
| `clicked_league_site_button_on_find_a_league_page` | `league_id`, `league_name` | League website button clicked |

### Share Buttons

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `clicked_share_button_find_a_league_page_league_card` | `league_id`, `league_name`, `sport` | Share clicked on league card |
| `clicked_share_button_league_details_page` | `league_id`, `league_name`, `sport` | Share clicked on league details |

### League Card Interactions

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `swipe_left_on_league_card_league_information` | `league_id`, `league_name` | User swiped left on league card |

### Search Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `used_search_navigation_desktop` | `search_term` | Search used in desktop navigation |
| `used_search_homepage_banner` | `search_term` | Search used in homepage banner |
| `used_search_find_a_league_page` | `search_term` | Search used on find-a-league page |
| `used_search_about_us_page` | `search_term` | Search used on about us page |

### Location Services

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `allowed_location_services` | None | User allowed location services |
| `declined_location_services` | None | User declined location services |

### Quick Filters - Homepage

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `clicked_age_group_quick_filter_homepage` | `age_group` | Age group quick filter clicked |
| `clicked_sport_quick_filter_homepage` | `sport` | Sport quick filter clicked |

### Applied Filters

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `applied_filter_age_group` | `age_group` | Age group filter applied |
| `applied_filter_sport` | `sport` | Sport filter applied |
| `applied_filter_gender` | `gender` | Gender filter applied |
| `applied_filter_day` | `day` | Day filter applied |
| `applied_filter_distance` | `distance` | Distance filter applied |

### Applied Sorts

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `applied_sort_venue_location` | None | Sorted by venue location |
| `applied_sort_price` | None | Sorted by price |
| `applied_sort_registration_date` | None | Sorted by registration date |
| `applied_sort_season_start_date` | None | Sorted by season start date |

### Map Interactions

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `move_or_zoom_the_embedded_map` | None | User moved or zoomed map |
| `clicked_map_pin_cluster` | `venue_name`, `league_count` | Map pin cluster clicked |
| `clicked_map_view_mobile` | None | Switched to map view on mobile |
| `clicked_list_view_mobile` | None | Switched to list view on mobile |
| `swiped_up_bottom_sheet_on_find_a_league_page_mobile` | None | Bottom sheet swiped up |
| `swiped_down_bottom_sheet_on_find_a_league_page_mobile` | None | Bottom sheet swiped down |

### Scrolling Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `scroll_league_cards_in_list_view` | None | Scrolled through league cards |
| `scroll_bottom_sheet_when_map_view_is_visible_on_find_a_league_page_mobile` | None | Scrolled bottom sheet in map view |
| `scrolled_to_section` | `section_name` | Scrolled to specific section |

### Newsletter Subscription

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `subscribed_league_notifications_list_email_address` | `email` | Subscribed with email |
| `subscribed_league_notifications_list_sports` | `sports` | Selected sports for notifications |
| `subscribed_league_notifications_list_location` | `location` | Selected location for notifications |

### Footer Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `clicked_email_link_in_footer` | None | Email link clicked in footer |
| `clicked_social_media_link_in_footer` | `social_media_platform` | Social media link clicked |

### Exit Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `exited_on_homepage` | None | User exited on homepage |
| `exited_on_about_us` | None | User exited on about us page |
| `exited_on_find_a_league` | None | User exited on find-a-league page |
| `exited_on_league_detail` | None | User exited on league detail page |

### Session Duration Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `session_duration_more_than_1_min` | None | Session lasted more than 1 minute |
| `session_duration_less_than_1_min` | None | Session lasted less than 1 minute |
| `session_duration_more_than_5_min` | None | Session lasted more than 5 minutes |
| `session_duration_less_than_5_min` | None | Session lasted less than 5 minutes |

## GTM Setup Instructions

### 1. Create Custom Event Triggers
For each event above, create a trigger in GTM:
- **Trigger Type:** Custom Event
- **Event name:** (exact event name from table)
- **This trigger fires on:** All Custom Events

### 2. Create GA4 Event Tags
For each trigger, create a corresponding GA4 Event tag:
- **Tag Type:** Google Analytics: GA4 Event
- **Measurement ID:** Your GA4 Measurement ID
- **Event Name:** (choose meaningful name for GA4)
- **Event Parameters:** Map the parameters using Data Layer Variables

### 3. Create Data Layer Variables
For parameters, create Data Layer Variables:
- **Variable Type:** Data Layer Variable
- **Data Layer Variable Name:** (parameter name, e.g., `league_id`, `search_term`)

### 4. Example GTM Configuration

**Trigger Example:**
```
Name: Search Homepage Banner
Type: Custom Event
Event name: used_search_homepage_banner
```

**Tag Example:**
```
Name: GA4 - Search Homepage Banner
Type: Google Analytics: GA4 Event
Event Name: search_homepage
Event Parameters:
- search_term: {{DLV - search_term}}
```

**Data Layer Variable Example:**
```
Name: DLV - search_term
Type: Data Layer Variable
Data Layer Variable Name: search_term
```

## Testing
1. Use GTM Preview mode to test events
2. Check that events appear in GA4 DebugView
3. Verify parameters are being passed correctly

## Notes
- All events respect user cookie consent via Klaro
- Events only fire when user has consented to analytics
- Session tracking is automatic once analytics is initialized
- Some events may require additional setup in the UI components 