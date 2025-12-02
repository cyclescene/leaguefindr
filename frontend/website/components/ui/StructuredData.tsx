'use client'

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'SportsEvent'
  data: any
}

export function StructuredData({ type, data }: StructuredDataProps) {
  let schema: any = {}

  switch (type) {
    case 'Organization':
      schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "LeagueFindr",
        "url": "https://leaguefindr.com",
        "logo": "https://leaguefindr.com/images/logo.png",
        "description": "Discover, explore and play in local sports leagues near you. Connect with recreational and competitive sports leagues in your area.",
        "sameAs": [
          "https://twitter.com/leaguefindr"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "url": "https://leaguefindr.com/about"
        }
      }
      break

    case 'WebSite':
      schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "LeagueFindr",
        "url": "https://leaguefindr.com",
        "description": "Find local sports leagues near you",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://leaguefindr.com/find-a-league?query={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
      break

    case 'SportsEvent':
      if (data) {
        schema = {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          "name": `${data.organization.name} - ${data.sport.name} League`,
          "description": data.seasonDetails,
          "startDate": data.seasonStartDate.toISOString(),
          "endDate": data.seasonEndDate.toISOString(),
          "location": {
            "@type": "Place",
            "name": data.venue.name,
            "address": data.venue.address
          },
          "organizer": {
            "@type": "Organization",
            "name": data.organization.name,
            "url": data.organization.url
          },
          "offers": {
            "@type": "Offer",
            "price": data.seasonFee || data.perGameFee || 0,
            "priceCurrency": "USD",
            "url": data.registrationUrl,
            "availability": "https://schema.org/InStock"
          }
        }
      }
      break
  }

  if (Object.keys(schema).length === 0) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
} 