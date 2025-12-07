'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Users, DollarSign, Share2, X } from 'lucide-react'
import { League } from '@/lib/types'
import { SportIcon } from '@/components/ui'
import { getRegistrationStatus, type RegistrationStatus } from '@/lib/utils'
import { Analytics } from '@/lib/analytics'
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon
} from 'react-share'
import React from 'react'
import { createPortal } from 'react-dom'

interface LeagueCardProps {
  league: League
  className?: string
  variant?: 'default' | 'mobile-drawer'  // Add variant for mobile drawer
}

// Share Modal Component that renders via portal
function ShareModal({ 
  isOpen, 
  onClose, 
  shareUrl, 
  leagueName 
}: { 
  isOpen: boolean
  onClose: () => void
  shareUrl: string
  leagueName: string
}) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-80 max-w-full relative flex flex-col items-center mx-4">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-lg font-semibold mb-4">Share with</div>
        {/* Social Media Buttons */}
        <div className="flex gap-4 mb-4">
          <FacebookShareButton url={shareUrl} title={leagueName}>
            <FacebookIcon size={40} round />
          </FacebookShareButton>
          <TwitterShareButton url={shareUrl} title={leagueName}>
            <TwitterIcon size={40} round />
          </TwitterShareButton>
          <WhatsappShareButton url={shareUrl} title={leagueName}>
            <WhatsappIcon size={40} round />
          </WhatsappShareButton>
        </div>
        {/* Native Share (if available) */}
        {typeof window !== 'undefined' && navigator.share && (
          <button
            className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 hover:bg-gray-200"
            onClick={() => {
              navigator.share({ title: leagueName, url: shareUrl })
              onClose()
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
  )

  return createPortal(modalContent, document.body)
}

export function LeagueCard({ league, className = '', variant = 'default' }: LeagueCardProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  // Set share URL on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/leagues/${league.id}`)
    }
  }, [league.id])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Handle share functionality - open modal
  const handleShare = () => {
    // Track the share event
    Analytics.clickedShareFindALeague(league.id, league.organization.name, league.sport.name)
    setShowShareModal(true)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Use the new robust registration status system
  const registrationStatus = getRegistrationStatus(league.registrationDeadline)

  // SportIcon now handles database sport names directly

  // Use season_fee directly as player fee (it's already per-player cost)
  const playerFee = league.seasonFee || null

  // Days until registration deadline
  const daysUntilDeadline = registrationStatus.daysRemaining

  // Venue name and distance display
  const venueDisplay = league.distance !== undefined 
    ? `${league.venue.name} • ${league.distance} mi away`
    : league.venue.name

  // Number of games (use duration if available)
  const numGames = league.duration ? `${league.duration} games` : ''

  // Game days (compact)
  const gameDays = league.gameDays?.length ? league.gameDays.join(', ') : ''

  // Mobile drawer variant - simplified layout
  if (variant === 'mobile-drawer') {
    return (
      <>
        <div className={`bg-[#F4F1E6] rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm transition-all duration-300 overflow-hidden ${className}`}>
          {/* Primary Info - Compact */}
          <div className="p-4 flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-light-green/10 rounded-lg flex items-center justify-center">
                <SportIcon sport={league.sport.name} size={20} className="text-light-green" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-dirk font-bold text-base text-gray-900 truncate">{league.organization.name}</h3>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-700 mt-0.5">
                {[
                  league.sport?.name,
                  league.gender,
                  league.division
                ].filter(Boolean).map((item, index, filteredArray) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="w-1 h-1 bg-gray-400 rounded-full"></span>}
                    <span className={index === 0 ? "font-medium" : ""}>{item}</span>
                  </React.Fragment>
                ))}
              </div>
              {/* Enroll By - Only additional info shown */}
              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span>Enroll by</span>
                <span className="font-semibold">{formatDate(league.registrationDeadline)}</span>
                {daysUntilDeadline > 0 && <span className="text-gray-500">({daysUntilDeadline} days left)</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex gap-2 px-4 pb-4">
            <Link
              href={`/leagues/${league.id}`}
              onClick={() => Analytics.clickedMoreInfoFindALeague(league.id, league.organization.name, league.sport.name)}
              className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md font-medium text-xs bg-white hover:bg-gray-50 transition-colors text-center"
            >
              More Info
            </Link>
            <button
              onClick={handleShare}
              className="px-2 py-1.5 border border-gray-300 text-gray-700 rounded-md text-xs bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
              title="Share league"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={league.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (registrationStatus.isOpen) {
                  Analytics.clickedSignUpFindALeague(league.id, league.organization.name, league.sport.name)
                }
              }}
              className={`flex-1 px-3 py-1.5 rounded-md font-medium text-xs transition-colors text-center ${
                registrationStatus.isOpen
                  ? 'bg-dark-green text-white hover:bg-dark-green/90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              aria-disabled={!registrationStatus.isOpen}
            >
              {registrationStatus.isOpen ? 'Sign Up' : 'Closed'}
            </a>
          </div>
        </div>

        {/* Share Modal - Rendered via Portal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={shareUrl}
          leagueName={league.organization.name}
        />
      </>
    )
  }

  // Default variant - full layout
  return (
    <>
      <div className={`bg-[#F4F1E6] rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}>
        {/* Primary Info */}
        <div className="p-6 pb-3 flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-light-green/10 rounded-xl flex items-center justify-center">
              <SportIcon sport={league.sport.name} size={28} className="text-light-green" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-dirk font-black text-lg text-gray-900 truncate">{league.organization.name}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mt-1">
              {[
                league.sport?.name,
                league.gender,
                league.division
              ].filter(Boolean).map((item, index, filteredArray) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="w-1 h-1 bg-gray-400 rounded-full"></span>}
                  <span className={index === 0 ? "font-medium" : ""}>{item}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Info */}
        <div className="px-6 pb-2 flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-700">
          {/* Player Fee */}
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span>Est. Player Fee:</span>
            <span className="font-semibold">{playerFee ? `$${formatPrice(playerFee)}` : 'Contact Organizer'}</span>
          </div>
          {/* Registration Deadline */}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>Enroll by</span>
            <span className="font-semibold">{formatDate(league.registrationDeadline)}</span>
            {daysUntilDeadline > 0 && <span className="ml-1 text-xs text-gray-500">({daysUntilDeadline} days left)</span>}
          </div>
          {/* Season Start */}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>Starts</span>
            <span className="font-semibold">{formatDate(league.seasonStartDate)}</span>
          </div>
          {/* Number of Games / Game Days */}
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-500" />
            <span>{numGames}{numGames && gameDays ? ' | ' : ''}{gameDays}</span>
          </div>
          {/* Venue Name / Distance (placeholder) */}
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{venueDisplay}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <Link
            href={`/leagues/${league.id}`}
            onClick={() => Analytics.clickedMoreInfoFindALeague(league.id, league.organization.name, league.sport.name)}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm bg-white hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 text-center"
          >
            More Info
          </Link>
          <button
            onClick={handleShare}
            className="px-3 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm bg-white hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 flex items-center justify-center"
            title="Share league"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <a
            href={league.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (registrationStatus.isOpen) {
                Analytics.clickedSignUpFindALeague(league.id, league.organization.name, league.sport.name)
              }
            }}
            className={`flex-1 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 text-center ${
              registrationStatus.isOpen
                ? 'bg-dark-green text-white hover:bg-dark-green/90 shadow-sm hover:shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-disabled={!registrationStatus.isOpen}
          >
            {registrationStatus.isOpen ? 'Sign Up' : 'Closed'}
          </a>
        </div>
      </div>

      {/* Share Modal - Rendered via Portal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        leagueName={league.organization.name}
      />
    </>
  )
} 