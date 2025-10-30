import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { AddSportForm } from "./AddSportForm";

interface ActionButtonsProps {
  onSportAdded?: () => void;
  onOrgAdded?: () => void;
  onVenueAdded?: () => void;
  onLeagueAdded?: () => void;
}

export function ActionButtons({
  onSportAdded,
  onOrgAdded,
  onVenueAdded,
  onLeagueAdded,
}: ActionButtonsProps) {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const handleCloseDialog = () => setOpenDialog(null);

  return (
    <>
      <ButtonGroup>
        <Button variant="brandDark" onClick={() => setOpenDialog("sport")}>
          Add Sport
        </Button>
        <Button variant="brandDark" onClick={() => setOpenDialog("org")}>
          Add Org
        </Button>
        <Button variant="brandDark" onClick={() => setOpenDialog("venue")}>
          Add Venue
        </Button>
        <Button variant="brandDark" onClick={() => setOpenDialog("league")}>
          Add League
        </Button>
      </ButtonGroup>

      {/* Add Sport Dialog */}
      <Dialog open={openDialog === "sport"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="border-0">
          <DialogHeader className="bg-brand-dark text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Add New Sport</DialogTitle>
            <DialogDescription className="text-gray-200">
              Submit a new sport to our platform. Your submission will be reviewed by admins.
            </DialogDescription>
          </DialogHeader>
          <AddSportForm
            onSuccess={onSportAdded}
            onClose={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Add Org Dialog */}
      <Dialog open={openDialog === "org"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="border-0">
          <DialogHeader className="bg-brand-dark text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Create Organization</DialogTitle>
            <DialogDescription className="text-gray-200">
              Create a new organization for managing leagues and sports.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Venue Dialog */}
      <Dialog open={openDialog === "venue"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="border-0">
          <DialogHeader className="bg-brand-dark text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Add Venue</DialogTitle>
            <DialogDescription className="text-gray-200">
              Submit a new venue location. Include the address for precise location mapping.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add League Dialog */}
      <Dialog open={openDialog === "league"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="border-0">
          <DialogHeader className="bg-brand-dark text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Create League</DialogTitle>
            <DialogDescription className="text-gray-200">
              Create a new league submission. Include details about the sport, venue, and schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
