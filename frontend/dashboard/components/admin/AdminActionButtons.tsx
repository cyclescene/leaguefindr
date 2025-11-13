"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { AddSportForm } from "@/components/forms/AddSportForm"
import { AddVenueForm } from "@/components/forms/AddVenueForm"
import { AdminAddLeagueForm } from "@/components/forms/AdminAddLeagueForm"

interface AdminActionButtonsProps {
  onActionComplete?: () => void
}

export function AdminActionButtons({ onActionComplete }: AdminActionButtonsProps) {
  const [openDialog, setOpenDialog] = useState<string | null>(null)
  const [mapboxDropdownOpen, setMapboxDropdownOpen] = useState(false)

  const handleCloseDialog = () => setOpenDialog(null)

  const handleActionComplete = () => {
    onActionComplete?.()
    handleCloseDialog()
  }

  return (
    <>
      <ButtonGroup>
        <Button variant="brandDark" onClick={() => setOpenDialog("league")}>
          Add League
        </Button>
        <Button variant="brandDark" onClick={() => setOpenDialog("sport")}>
          Add Sport
        </Button>
        <Button variant="brandDark" onClick={() => setOpenDialog("venue")}>
          Add Venue
        </Button>
      </ButtonGroup>

      {/* Add Sport Dialog */}
      <Dialog open={openDialog === "sport"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="border-0 !max-w-2xl">
          <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Add Sport</DialogTitle>
            <DialogDescription className="text-gray-200">
              Add a new sport to the system. It will be immediately available for league submissions.
            </DialogDescription>
          </DialogHeader>
          <AddSportForm onSuccess={handleActionComplete} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      {/* Add Venue Dialog */}
      <Dialog open={openDialog === "venue"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="border-0 !max-w-2xl">
          <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Add Venue</DialogTitle>
            <DialogDescription className="text-gray-200">
              Add a new venue to the system. It will be immediately available for league submissions.
            </DialogDescription>
          </DialogHeader>
          <AddVenueForm
            onSuccess={handleActionComplete}
            onClose={handleCloseDialog}
            onMapboxDropdownStateChange={setMapboxDropdownOpen}
          />
        </DialogContent>
      </Dialog>

      {/* Add League Dialog */}
      <Dialog open={openDialog === "league"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Create League</DialogTitle>
            <DialogDescription className="text-gray-200">
              Create a new league submission on behalf of an organization. Select the organization first, then fill in the league details.
            </DialogDescription>
          </DialogHeader>
          <AdminAddLeagueForm onSuccess={handleActionComplete} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </>
  )
}
