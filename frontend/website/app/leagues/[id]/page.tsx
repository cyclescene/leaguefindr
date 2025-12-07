'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { League } from '@/lib/types'
import { LeaguesApi } from '@/lib/api'
import { Analytics } from '@/lib/analytics'
import { Footer } from '@/components/layout'
import { StructuredData } from '@/components/ui'
import { Share2, X } from 'lucide-react'
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon
} from 'react-share'

export default function LeagueDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [league, setLeague] = useState<League | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  // Set share URL on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/leagues/${params.id}`)
    }
  }, [params.id])

  // Smart back navigation that preserves search state
  const handleBackToResults = () => {
    Analytics.clickedBackToResults()
    
    if (typeof window !== 'undefined') {
      // First, try to use the referrer URL if it's from find-a-league
      const referrer = document.referrer
      if (referrer && referrer.includes('/find-a-league')) {
        // Parse the referrer URL to get existing params
        const referrerUrl = new URL(referrer)
        const referrerParams = new URLSearchParams(referrerUrl.search)
        
        // Check if we have additional filters in sessionStorage that aren't in the referrer
        const cachedFilters = sessionStorage.getItem('leagueFindr_filters')
        if (cachedFilters) {
          try {
            const filters = JSON.parse(cachedFilters)
            if (filters && typeof filters === 'object') {
              // Add any cached filters that aren't already in the referrer URL
              Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== '' && value !== null && value !== undefined && !referrerParams.has(key)) {
                  if (Array.isArray(value) && value.length > 0) {
                    referrerParams.set(key, value.join(','))
                  } else if (typeof value === 'string' || typeof value === 'number') {
                    referrerParams.set(key, value.toString())
                  }
                }
              })
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        // Use the enhanced URL with both referrer params and additional filters
        const enhancedUrl = `/find-a-league?${referrerParams.toString()}`
        router.push(enhancedUrl)
        return
      }
      
      // Fallback: try to reconstruct from sessionStorage (minimal approach)
      const cachedFilters = sessionStorage.getItem('leagueFindr_filters')
      const cachedUserLocation = sessionStorage.getItem('cachedUserLocation')
      
      // Only reconstruct URL if we have either location or filters
      if (cachedFilters || cachedUserLocation) {
        const params = new URLSearchParams()
        
        // Add location if it exists
        if (cachedUserLocation) {
          try {
            const location = JSON.parse(cachedUserLocation)
            if (location && location.lat && location.lng) {
              params.set('location', `${location.lat},${location.lng}`)
              if (location.radius) {
                params.set('radius', location.radius.toString())
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        // Add filters if they exist
        if (cachedFilters) {
          try {
            const filters = JSON.parse(cachedFilters)
            if (filters && typeof filters === 'object') {
              Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== '' && value !== null && value !== undefined) {
                  if (Array.isArray(value) && value.length > 0) {
                    params.set(key, value.join(','))
                  } else if (typeof value === 'string' || typeof value === 'number') {
                    params.set(key, value.toString())
                  }
                }
              })
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        // Navigate to find-a-league with preserved state
        const queryString = params.toString()
        if (queryString) {
          router.push(`/find-a-league?${queryString}`)
          return
        }
      }
    }
    
    // Final fallback: simple back navigation or clean find-a-league
    router.push('/find-a-league')
  }

  useEffect(() => {
    const loadLeague = async () => {
      if (!params.id) return
      setLoading(true)
      setError(null)
      try {
        const response = await LeaguesApi.getLeagueById(params.id as string)
        if (!response.success || !response.data) {
          throw new Error(response.error || 'League not found')
        }
        setLeague(response.data)
        
        // Track page view with league details
        Analytics.pageViewLeagueDetail(response.data.id, response.data.organization.name, response.data.sport.name)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load league details')
      } finally {
        setLoading(false)
      }
    }
    loadLeague()
  }, [params.id])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-1 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto p-4">
          <div className="bg-white rounded-xl shadow p-6 animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !league) {
    return (
      <main className="min-h-screen bg-gray-1 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error || 'League not found'}</span>
          </div>
        </div>
      </main>
    )
  }

  // --- UI ---
  return (
    <main className="min-h-screen bg-gray-1 flex flex-col">
      {league && (
        <head>
          <StructuredData type="SportsEvent" data={league} />
        </head>
      )}
      
      {/* Back link */}
      <div className="w-full max-w-4xl mx-auto pt-4 px-2">
        <button
          className="text-sm text-gray-600 flex items-center gap-1 mb-2 hover:underline"
          onClick={handleBackToResults}
        >
          <span>&larr;</span> Back to results
        </button>
      </div>

      {/* Responsive Layout */}
      <div className="w-full max-w-4xl mx-auto px-2 md:grid md:grid-cols-3 md:gap-8 mb-8">
        {/* Left: Summary Card and Actions */}
        <div className="md:col-span-1 md:sticky md:top-8 space-y-6 flex flex-col items-center">
          {/* Summary Card */}
          <div className="bg-[#F4F1E6] rounded-xl p-4 shadow mb-4 w-full max-w-xs mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="uppercase text-xs font-bold tracking-wide text-gray-700 mb-1">{league.sport.name}</div>
                <div className="font-black text-lg text-gray-900 leading-tight">{league.organization.name}</div>
                <div className="text-sm text-gray-600">{league.gender} League{league.distance && `  3 ${Math.round(league.distance)} mi away`}</div>
              </div>
              <div className="flex-shrink-0">{/* Placeholder for sport icon or logo if needed */}</div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 font-medium">ENROLL BY</span>
              <span className="text-sm font-bold text-gray-900">{formatDate(league.registrationDeadline)}</span>
            </div>
            {/* Share and Sign Up Buttons */}
            <div className="flex gap-2 mt-4 items-center justify-between w-full">
              <button
                className="flex-1 px-4 py-2 rounded-lg font-bold text-sm bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 shadow text-center"
                onClick={() => {
                  Analytics.clickedShareLeagueDetails(league.id, league.organization.name, league.sport.name)
                  setShowShareModal(true)
                }}
                type="button"
              >
                Share
              </button>
              <a
                href={league.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => Analytics.clickedSignUpLeagueInfo(league.id, league.organization.name, league.sport.name)}
                className="flex-1 px-4 py-2 rounded-lg font-bold text-sm bg-dark-green text-white hover:bg-dark-green/90 shadow text-center"
                style={{minWidth: '100px'}}
              >
                Sign Up
              </a>
            </div>
          </div>
          {/* League Site Button (desktop only) */}
          <a
            href={league.organization.url || league.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => Analytics.clickedLeagueSite(league.id, league.organization.name)}
            className="hidden md:flex bg-dark-green text-white text-lg font-bold rounded-xl py-4 px-8 items-center justify-center gap-2 shadow hover:bg-dark-green/90 mx-auto"
            style={{maxWidth: '260px'}}
          >
            League Site
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75H6.75m10.5 0v10.5m0-10.5L6.75 17.25" />
            </svg>
          </a>
        </div>
        {/* Right: League Info and More Details */}
        <div className="md:col-span-2 space-y-6">
          {/* League Info */}
          <section>
            <h2 className="text-xs font-bold text-gray-700 tracking-wide mb-1">LEAGUE INFO</h2>
            <div className="divide-y divide-gray-200 bg-white rounded-xl shadow overflow-hidden">
              <div className="p-4">
                <div className="text-xs font-semibold text-gray-500 mb-1">SEASON</div>
                <div className="text-sm text-gray-900">
                  {league.duration ? `${league.duration} Games` : ''}
                  {league.gameDays?.length ? ` | ${league.gameDays.join(', ')}` : ''}
                  {league.gameStartTime && league.gameEndTime ? ` | ${league.gameStartTime} - ${league.gameEndTime}` : ''}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Season starts {formatDate(league.seasonStartDate)}<br />
                  Registration ends {formatDate(league.registrationDeadline)}
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs font-semibold text-gray-500 mb-1">LOCATION</div>
                <div className="text-sm text-gray-900">{league.venue?.name || 'Contact Organizer'}</div>
                <div className="text-xs text-gray-500">{league.venue?.address || ''}{league.distance && `  3 ${Math.round(league.distance)} mi away`}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-semibold text-gray-500 mb-1">FEES</div>
                <div className="text-sm text-gray-900">Est. Player Fee: {league.seasonFee ? `$${formatPrice(league.seasonFee)}` : 'Contact Organizer'}</div>
                {league.perGameFee && <div className="text-sm text-gray-900">Team Referee Fee: ${formatPrice(league.perGameFee)} / game</div>}
              </div>
            </div>
          </section>
          {/* More League Details */}
          <section>
            <h2 className="text-xs font-bold text-gray-700 tracking-wide mb-1">MORE LEAGUE DETAILS</h2>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-sm text-gray-900 whitespace-pre-line">
                {league.seasonDetails || 'No additional details available.'}
              </div>
            </div>
          </section>
          {/* League Site Button (mobile only) */}
          <a
            href={league.organization.url || league.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block md:hidden w-full bg-dark-green text-white text-lg font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow hover:bg-dark-green/90"
          >
            League Site
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75H6.75m10.5 0v10.5m0-10.5L6.75 17.25" />
            </svg>
          </a>
        </div>
      </div>
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-80 max-w-full relative flex flex-col items-center">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowShareModal(false)}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-lg font-semibold mb-4">Share with</div>
            {/* Social Media Buttons */}
            <div className="flex gap-4 mb-4">
              <FacebookShareButton url={shareUrl} title={league.organization.name}>
                <FacebookIcon size={40} round />
              </FacebookShareButton>
              <TwitterShareButton url={shareUrl} title={league.organization.name}>
                <TwitterIcon size={40} round />
              </TwitterShareButton>
              <WhatsappShareButton url={shareUrl} title={league.organization.name}>
                <WhatsappIcon size={40} round />
              </WhatsappShareButton>
            </div>
            {/* Native Share (if available) */}
            {typeof window !== 'undefined' && navigator.share && (
              <button
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 hover:bg-gray-200"
                onClick={() => {
                  navigator.share({ title: league.organization.name, url: shareUrl })
                  setShowShareModal(false)
                }}
              >
                <Share2 className="w-7 h-7 mb-1 text-gray-600" />
                <span className="text-xs text-gray-700">Text</span>
              </button>
            )}
            <div className="w-full text-center text-xs text-gray-500 mb-2">Or share with link</div>
            <div className="flex items-center w-full bg-gray-100 rounded-lg px-3 py-2">
              <input
                className="flex-1 bg-transparent text-gray-700 text-sm outline-none"
                value={shareUrl}
                readOnly
              />
              <button
                className="ml-2 text-dark-green hover:text-green-700"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
                aria-label="Copy link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8m-4-4h4m-4-4h4M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            {copied && <div className="text-green-600 text-xs mt-2">Copied!</div>}
          </div>
        </div>
      )}
      <Footer />
    </main>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(price)
} 