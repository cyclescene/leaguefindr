'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useLeague, useAdminLeagueOperations } from '@/hooks/useAdminLeagues'
import { LeagueFormProvider } from '@/context/LeagueFormContext'
import { AddLeagueForm } from '@/components/forms/AddLeagueForm'

interface AdminLeagueReviewModalProps {
  leagueId: number | null
  isOpen: boolean
  onClose: () => void
  onApproveSuccess?: () => void
  onRejectSuccess?: () => void
}

export function AdminLeagueReviewModal({
  leagueId,
  isOpen,
  onClose,
  onApproveSuccess,
  onRejectSuccess,
}: AdminLeagueReviewModalProps) {
  const { league, isLoading, error } = useLeague(leagueId)
  const { approveLeague, rejectLeague } = useAdminLeagueOperations()
  const [rejectionNotes, setRejectionNotes] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isMapboxDropdownOpen, setIsMapboxDropdownOpen] = useState(false)

  // Monitor Mapbox dropdown visibility via custom events
  useEffect(() => {
    if (!isOpen) return

    const handleMapboxOpen = () => setIsMapboxDropdownOpen(true)
    const handleMapboxClose = () => setIsMapboxDropdownOpen(false)

    window.addEventListener('mapboxDropdownOpen', handleMapboxOpen)
    window.addEventListener('mapboxDropdownClose', handleMapboxClose)

    return () => {
      window.removeEventListener('mapboxDropdownOpen', handleMapboxOpen)
      window.removeEventListener('mapboxDropdownClose', handleMapboxClose)
    }
  }, [isOpen])

  const handleApprove = async () => {
    if (!leagueId) return

    try {
      setIsApproving(true)
      await approveLeague(leagueId)
      onApproveSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error approving league:', err)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!leagueId) return

    try {
      setIsRejecting(true)
      await rejectLeague(leagueId, rejectionNotes)
      onRejectSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error rejecting league:', err)
    } finally {
      setIsRejecting(false)
      setRejectionNotes('')
    }
  }

  const handleCloseModal = () => {
    setRejectionNotes('')
    onClose()
  }

  const handlePointerDownOutside = (e: Event) => {
    // Check if click is on Mapbox AddressAutofill dropdown or suggestions
    const target = e.target as HTMLElement

    // Mapbox AddressAutofill creates elements with various classes and attributes
    // We need to prevent dialog closing when interacting with the autocomplete dropdown
    const isMapboxElement = target.closest(
      '[class*="mapbox"], [class*="address"], [class*="suggestion"], [role="option"], [role="listbox"], [role="combobox"]'
    )

    if (isMapboxElement) {
      e.preventDefault()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Don't close if Mapbox dropdown is open
      if (!open && !isMapboxDropdownOpen) {
        handleCloseModal()
      }
    }}>
      <DialogContent
        className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto"
        onPointerDownOutside={handlePointerDownOutside}
      >
        <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
          <DialogTitle className="text-white">Review League Submission</DialogTitle>
          <DialogDescription className="text-gray-200">
            Review the league details below. Click Approve to accept or Reject with notes to send back to the organization.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
          </div>
        )}

        {error && (
          <div className="px-6 py-4">
            <p className="text-red-600">Error loading league details: {error.message}</p>
          </div>
        )}

        {league && !isLoading && (
          <>
            {/* League form in view/review mode */}
            <div className="px-6 py-4">
              {(() => {
                console.log('=== AdminLeagueReviewModal ===')
                console.log('Full league object:', league)
                console.log('league.draft_data:', league.draft_data)
                console.log('typeof league.draft_data:', typeof league.draft_data)
                return null
              })()}
              <LeagueFormProvider
                value={{
                  mode: 'view',
                  leagueId: league.id,
                  prePopulatedFormData: league.draft_data as any,
                }}
              >
                <AddLeagueForm />
              </LeagueFormProvider>
            </div>

            {/* Approval Summary - Shows what will be created */}
            <div className="border-t px-6 py-4 space-y-4">
              {league.sport_id && league.venue_id && (
                <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700 font-medium">
                        This league is ready to be approved - all required resources exist:
                      </p>
                      <ul className="mt-2 text-sm text-green-600 space-y-1">
                        <li className="flex items-center">
                          <span className="mr-2">✓</span>
                          <span><strong>Sport ID:</strong> {league.sport_id}</span>
                        </li>
                        <li className="flex items-center">
                          <span className="mr-2">✓</span>
                          <span><strong>Venue ID:</strong> {league.venue_id}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {(!league.sport_id || !league.venue_id) && (
                <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 font-medium">
                        This league submission will create new resources on approval:
                      </p>
                      <ul className="mt-2 text-sm text-yellow-600 space-y-1">
                        {!league.sport_id && (
                          <li className="flex items-center">
                            <span className="mr-2">•</span>
                            <span><strong>New Sport</strong> will be created</span>
                          </li>
                        )}
                        {!league.venue_id && (
                          <li className="flex items-center">
                            <span className="mr-2">•</span>
                            <span><strong>New Venue</strong> will be created</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="rejection-notes">Rejection Notes (Required if rejecting)</Label>
                <Textarea
                  id="rejection-notes"
                  placeholder="Explain why this league submission is being rejected. These notes will be sent to the organization."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="mt-2"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionNotes.length}/500 characters
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleCloseModal} disabled={isApproving || isRejecting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isApproving || isRejecting || !rejectionNotes.trim()}
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject'
                  )}
                </Button>
                <Button
                  variant="brandDark"
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    'Approve'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
