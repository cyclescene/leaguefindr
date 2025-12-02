'use client'

import { useEffect } from 'react'

// Get GTM Container ID from environment variable, fallback to hardcoded value
const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID || 'GTM-5NSHDJW4'

const klaroConfig = {
  version: 1,
  elementID: 'klaro',
  styling: {
    theme: ['light', 'bottom'],
  },
  noAutoLoad: false,
  htmlTexts: true,
  embedded: false,
  groupByPurpose: true,
  storageMethod: 'localStorage',
  cookieName: 'klaro',
  cookieExpiresAfterDays: 365,
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  hideLearnMore: false,
  noticeAsModal: false,
  disablePoweredBy: true,
  additionalClass: 'leaguefindr-klaro',
  translations: {
    en: {
      consentModal: {
        title: 'We value your privacy',
        description: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. You can manage your preferences below.',
      },
      consentNotice: {
        title: '🍪 Cookie Notice',
        description: 'We use cookies to improve your experience. {learnMore}',
        learnMore: 'Manage preferences',
      },
      purposes: {
        analytics: 'Analytics',
        marketing: 'Marketing',
      },
      save: 'Save preferences',
      acceptAll: 'Accept all',
      acceptSelected: 'Accept selected',
      decline: 'Decline all',
    },
  },
  services: [
    {
      name: 'google-tag-manager',
      title: 'Google Tag Manager',
      description: 'We use Google Tag Manager to track website interactions and analyze user behavior to improve our platform.',
      purposes: ['analytics'],
      default: false,
      required: true,
      optOut: false,
      onlyOnce: true,
      onInit: `
        // Initialize dataLayer and gtag for Consent Mode v2
        window.dataLayer = window.dataLayer || [];
        window.gtag = function(){dataLayer.push(arguments)};
        gtag('consent', 'default', {
          'ad_storage': 'denied',
          'analytics_storage': 'denied', 
          'ad_user_data': 'denied',
          'ad_personalization': 'denied'
        });
        gtag('set', 'ads_data_redaction', true);
      `,
      onAccept: `
        // Notify GTM about all accepted services
        for(let k of Object.keys(opts.consents)){
          if (opts.consents[k]){
            let eventName = 'klaro-'+k+'-accepted';
            dataLayer.push({'event': eventName});
          }
        }
      `,
      callback: function(consent: boolean, service: any) {
        if (consent) {
          // Initialize dataLayer
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
          
          // Load GTM script with dynamic container ID
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
          document.head.appendChild(script);
          
          // Add noscript fallback with dynamic container ID
          const noscript = document.createElement('noscript');
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`;
          iframe.height = '0';
          iframe.width = '0';
          iframe.style.display = 'none';
          iframe.style.visibility = 'hidden';
          noscript.appendChild(iframe);
          document.body.appendChild(noscript);
        }
      }
    },
    {
      name: 'google-analytics',
      title: 'Google Analytics',
      description: 'We use Google Analytics to understand how visitors interact with our website.',
      purposes: ['analytics'],
      default: false,
      required: false,
      optOut: false,
      onlyOnce: true,
      cookies: [/^_ga(_.*)?/],
      onAccept: `
        gtag('consent', 'update', {
          'analytics_storage': 'granted'
        });
      `,
      onDecline: `
        gtag('consent', 'update', {
          'analytics_storage': 'denied'
        });
      `,
    },
    {
      name: 'google-ads',
      title: 'Google Ads & Marketing',
      description: 'These help us show you relevant ads and measure campaign effectiveness.',
      purposes: ['marketing'],
      default: false,
      required: false,
      optOut: false,
      onlyOnce: true,
      onAccept: `
        gtag('consent', 'update', {
          'ad_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'granted'
        });
      `,
      onDecline: `
        gtag('consent', 'update', {
          'ad_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied'
        });
      `,
    },
  ],
}

export function KlaroWrapper() {
  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      // Set global config
      (window as any).klaroConfig = klaroConfig
      
      // Dynamically import and initialize Klaro
      import('klaro').then((klaro) => {
        // Make klaro available globally for the cookies page
        (window as any).klaro = klaro
        
        // Initialize Klaro
        klaro.render(klaroConfig)
      }).catch((error) => {
        // Silently fail in production if Klaro fails to load
      })
    }
  }, [])

  return <div id="klaro" />
} 