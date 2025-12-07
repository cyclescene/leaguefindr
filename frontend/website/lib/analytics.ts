// Analytics utility for LeagueFindr
// Only tracks events when user has consented to analytics cookies

declare global {
  interface Window {
    dataLayer: any[]
    klaro: any
  }
}

// Check if user has consented to analytics via Klaro
function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const klaroConsent = localStorage.getItem('klaro')
    if (!klaroConsent) {
      return false
    }

    // Decode URL-encoded JSON
    const decodedConsent = decodeURIComponent(klaroConsent)
    const consent = JSON.parse(decodedConsent)
    
    // Check if Google Tag Manager is consented
    const hasConsent = consent?.['google-tag-manager'] === true
    return hasConsent
    
  } catch (error) {
    return false
  }
}

// Initialize dataLayer if it doesn't exist
function initializeDataLayer() {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
  }
}

// Generic event tracking function
function trackEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (typeof window === 'undefined') {
    return
  }

  if (!hasAnalyticsConsent()) {
    return
  }

  try {
    // Push to dataLayer for GTM
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: eventName,
        ...parameters
      })
    }
  } catch (error) {
    // Silently fail in production
  }
}

// Specific event tracking functions
export const Analytics = {
  // Page Views & Entry Points
  pageViewHomepage: () => {
    trackEvent('page_view_homepage')
  },

  pageViewAboutUs: () => {
    trackEvent('page_view_about_us')
  },

  pageViewFindALeague: () => {
    trackEvent('page_view_find_a_league')
  },

  pageViewLeagueDetail: (leagueId: string | number, leagueName: string, sport: string) => {
    trackEvent('page_view_league_detail', {
      league_id: leagueId,
      league_name: leagueName,
      sport: sport
    })
  },

  enteredOnHomepage: () => {
    trackEvent('entered_on_homepage')
  },

  enteredOnFindALeague: () => {
    trackEvent('entered_on_find_a_league_page')
  },

  enteredOnLeagueInfo: (leagueId: string | number) => {
    trackEvent('entered_on_league_info_page', {
      league_id: leagueId
    })
  },

  // Navigation & Menu
  clickedHamburgerMenu: () => {
    trackEvent('clicked_hamburger_menu_mobile')
  },

  // CTA Buttons
  clickedSignUpFindALeague: (leagueId: string | number, leagueName: string, sport: string) => {
    trackEvent('clicked_sign_up_button_find_a_league_page', {
      league_id: leagueId,
      league_name: leagueName,
      sport: sport
    })
  },

  clickedSignUpLeagueInfo: (leagueId: string | number, leagueName: string, sport: string) => {
    trackEvent('clicked_sign_up_button_league_info_page', {
      league_id: leagueId,
      league_name: leagueName,
      sport: sport
    })
  },

  clickedMoreInfoFindALeague: (leagueId: string | number, leagueName: string, sport: string) => {
    trackEvent('clicked_more_info_button_find_a_league_page', {
      league_id: leagueId,
      league_name: leagueName,
      sport: sport
    })
  },

  // Share Buttons
  clickedShareFindALeague: (leagueId: string | number, leagueName: string, sport: string) => {
    trackEvent('clicked_share_button_find_a_league_page_league_card', {
      league_id: leagueId,
      league_name: leagueName,
      sport: sport
    })
  },

  clickedShareLeagueDetails: (leagueId: string | number, leagueName: string, sport: string) => {
    trackEvent('clicked_share_button_league_details_page', {
      league_id: leagueId,
      league_name: leagueName,
      sport: sport
    })
  },

  // League Card Interactions
  swipeLeftLeagueCard: (leagueId: string | number, leagueName: string) => {
    trackEvent('swipe_left_on_league_card_league_information', {
      league_id: leagueId,
      league_name: leagueName
    })
  },

  // Search Events
  usedSearchNavigation: (searchTerm: string) => {
    trackEvent('used_search_navigation_desktop', {
      search_term: searchTerm
    })
  },

  usedSearchHomepage: (searchTerm: string) => {
    trackEvent('used_search_homepage_banner', {
      search_term: searchTerm
    })
  },

  usedSearchFindALeague: (searchTerm: string) => {
    trackEvent('used_search_find_a_league_page', {
      search_term: searchTerm
    })
  },

  usedSearchAboutUs: (searchTerm: string) => {
    trackEvent('used_search_about_us_page', {
      search_term: searchTerm
    })
  },

  // Location Services
  allowedLocationServices: () => {
    trackEvent('allowed_location_services')
  },

  declinedLocationServices: () => {
    trackEvent('declined_location_services')
  },

  // Quick Filters - Homepage
  clickedAgeGroupQuickFilter: (ageGroup: string) => {
    trackEvent('clicked_age_group_quick_filter_homepage', {
      age_group: ageGroup
    })
  },

  clickedSportQuickFilter: (sport: string) => {
    trackEvent('clicked_sport_quick_filter_homepage', {
      sport: sport
    })
  },

  // Applied Filters
  appliedFilterAgeGroup: (ageGroup: string) => {
    trackEvent('applied_filter_age_group', {
      age_group: ageGroup
    })
  },

  appliedFilterSport: (sport: string) => {
    trackEvent('applied_filter_sport', {
      sport: sport
    })
  },

  appliedFilterGender: (gender: string) => {
    trackEvent('applied_filter_gender', {
      gender: gender
    })
  },

  appliedFilterDay: (day: string) => {
    trackEvent('applied_filter_day', {
      day: day
    })
  },

  appliedFilterDistance: (distance: string) => {
    trackEvent('applied_filter_distance', {
      distance: distance
    })
  },

  // Applied Sorts
  appliedSortVenueLocation: () => {
    trackEvent('applied_sort_venue_location')
  },

  appliedSortPrice: () => {
    trackEvent('applied_sort_price')
  },

  appliedSortRegistrationDate: () => {
    trackEvent('applied_sort_registration_date')
  },

  appliedSortSeasonStartDate: () => {
    trackEvent('applied_sort_season_start_date')
  },

  // Map Interactions
  moveOrZoomMap: () => {
    trackEvent('move_or_zoom_the_embedded_map')
  },

  clickedMapPinCluster: (venueName: string, leagueCount: number) => {
    trackEvent('clicked_map_pin_cluster', {
      venue_name: venueName,
      league_count: leagueCount
    })
  },

  clickedMapViewMobile: () => {
    trackEvent('clicked_map_view_mobile')
  },

  clickedListViewMobile: () => {
    trackEvent('clicked_list_view_mobile')
  },

  swipedUpBottomSheet: () => {
    trackEvent('swiped_up_bottom_sheet_on_find_a_league_page_mobile')
  },

  swipedDownBottomSheet: () => {
    trackEvent('swiped_down_bottom_sheet_on_find_a_league_page_mobile')
  },

  // Scrolling Events
  scrollLeagueCardsListView: () => {
    trackEvent('scroll_league_cards_in_list_view')
  },

  scrollBottomSheetMapView: () => {
    trackEvent('scroll_bottom_sheet_when_map_view_is_visible_on_find_a_league_page_mobile')
  },

  scrolledToSection: (sectionName: string) => {
    trackEvent('scrolled_to_section', {
      section_name: sectionName
    })
  },

  // Newsletter Subscription
  subscribedLeagueNotificationsEmail: (email: string) => {
    trackEvent('subscribed_league_notifications_list_email_address', {
      email: email
    })
  },

  subscribedLeagueNotificationsSports: (sports: string[]) => {
    trackEvent('subscribed_league_notifications_list_sports', {
      sports: sports
    })
  },

  subscribedLeagueNotificationsLocation: (location: string) => {
    trackEvent('subscribed_league_notifications_list_location', {
      location: location
    })
  },

  // Navigation Events
  clickedBackToResults: () => {
    trackEvent('clicked_back_to_results_button_on_find_a_league_page')
  },

  clickedLeagueSite: (leagueId: string | number, leagueName: string) => {
    trackEvent('clicked_league_site_button_on_find_a_league_page', {
      league_id: leagueId,
      league_name: leagueName
    })
  },

  // Footer Events
  clickedEmailFooter: () => {
    trackEvent('clicked_email_link_in_footer')
  },

  clickedSocialMediaFooter: (platform: string) => {
    trackEvent('clicked_social_media_link_in_footer', {
      social_media_platform: platform
    })
  },

  // Exit Events
  exitedOnHomepage: () => {
    trackEvent('exited_on_homepage')
  },

  exitedOnAboutUs: () => {
    trackEvent('exited_on_about_us')
  },

  exitedOnFindALeague: () => {
    trackEvent('exited_on_find_a_league')
  },

  exitedOnLeagueDetail: () => {
    trackEvent('exited_on_league_detail')
  },

  // Session Duration Events
  sessionDurationMoreThan1Min: () => {
    trackEvent('session_duration_more_than_1_min')
  },

  sessionDurationLessThan1Min: () => {
    trackEvent('session_duration_less_than_1_min')
  },

  sessionDurationMoreThan5Min: () => {
    trackEvent('session_duration_more_than_5_min')
  },

  sessionDurationLessThan5Min: () => {
    trackEvent('session_duration_less_than_5_min')
  },

  // Generic custom event
  custom: (eventName: string, parameters: Record<string, any> = {}) => {
    trackEvent(eventName, parameters)
  },

  // Page Views & Navigation
  pageView: (pagePath: string, pageTitle: string) => {
    trackEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle
    })
  }
}

// Track page views based on path
function trackPageViewByPath(pathname: string) {
  switch (pathname) {
    case '/':
      Analytics.pageViewHomepage()
      break
    case '/about':
      Analytics.pageViewAboutUs()
      break
    case '/find-a-league':
      Analytics.pageViewFindALeague()
      break
    default:
      if (pathname.startsWith('/leagues/')) {
        // League detail page - would need league data to track properly
        // This will be handled in the league detail component
        return
      }
      // Generic page view for other pages
      trackEvent('page_view', {
        page_path: pathname,
        page_title: document.title
      })
  }
}

// Session duration tracking
let sessionStartTime: number
let oneMinuteTracked = false
let fiveMinuteTracked = false

function initSessionTracking() {
  sessionStartTime = Date.now()
  
  // Track 1 minute milestone
  setTimeout(() => {
    if (!oneMinuteTracked) {
      Analytics.sessionDurationMoreThan1Min()
      oneMinuteTracked = true
    }
  }, 60000)
  
  // Track 5 minute milestone
  setTimeout(() => {
    if (!fiveMinuteTracked) {
      Analytics.sessionDurationMoreThan5Min()
      fiveMinuteTracked = true
    }
  }, 300000)
  
  // Track session end to determine if less than milestones
  window.addEventListener('beforeunload', () => {
    const sessionDuration = Date.now() - sessionStartTime
    
    if (sessionDuration < 60000 && !oneMinuteTracked) {
      Analytics.sessionDurationLessThan1Min()
    }
    if (sessionDuration < 300000 && !fiveMinuteTracked) {
      Analytics.sessionDurationLessThan5Min()
    }
  })
}

// Check if this is an entry page
function trackEntryPoint(pathname: string, referrer: string) {
  // Only track entry if no referrer or referrer is external
  const isEntry = !referrer || !referrer.includes(window.location.hostname)
  
  if (isEntry) {
    switch (pathname) {
      case '/':
        Analytics.enteredOnHomepage()
        break
      case '/find-a-league':
        Analytics.enteredOnFindALeague()
        break
      default:
        if (pathname.startsWith('/leagues/')) {
          // Extract league ID from URL
          const leagueId = parseInt(pathname.split('/leagues/')[1], 10)
          if (!isNaN(leagueId)) {
            Analytics.enteredOnLeagueInfo(leagueId)
          }
        }
    }
  }
}

// Auto-track page views (call this in layout or page components)
export function initializeAnalytics() {
  if (typeof window !== 'undefined') {
    // Initialize session tracking
    initSessionTracking()
    
    // Track initial page view and entry point
    trackPageViewByPath(window.location.pathname)
    trackEntryPoint(window.location.pathname, document.referrer)
    
    // Track subsequent navigation (for SPA routing)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      setTimeout(() => trackPageViewByPath(window.location.pathname), 100)
    }
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      setTimeout(() => trackPageViewByPath(window.location.pathname), 100)
    }
    
    window.addEventListener('popstate', () => {
      setTimeout(() => trackPageViewByPath(window.location.pathname), 100)
    })
  }
} 