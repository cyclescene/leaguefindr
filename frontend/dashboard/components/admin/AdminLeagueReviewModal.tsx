'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useLeague } from '@/hooks/useAdminLeagues'
import { LeagueFormProvider } from '@/context/LeagueFormContext'
import { AdminAddLeagueForm } from '@/components/forms/AdminAddLeagueForm'

interface AdminLeagueReviewModalProps {
  leagueId: number | null
  isOpen: boolean
  onClose: () => void
  leagueStatus?: string
}

export function AdminLeagueReviewModal({
  leagueId,
  isOpen,
  onClose,
  leagueStatus,
}: AdminLeagueReviewModalProps) {
  const { league, isLoading, error } = useLeague(leagueId)
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
        onClose()
      }
    }}>
      <DialogContent
        className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto"
        onPointerDownOutside={handlePointerDownOutside}
      >
        <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
          <DialogTitle className="text-white">Edit League Submission</DialogTitle>
          <DialogDescription className="text-gray-200">
            Edit the league details and submit to create or update the league.
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
          <div className="px-6 py-4">
            <AdminAddLeagueForm
              prePopulatedData={league.form_data as any}
              leagueStatus={leagueStatus}
              onSuccess={() => {
                onClose()
              }}
              onClose={onClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
