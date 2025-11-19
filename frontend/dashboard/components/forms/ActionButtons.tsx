import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { AddLeagueForm } from "./AddLeagueForm";

interface ActionButtonsProps {
  onLeagueAdded?: () => void;
}

export function ActionButtons({
  onLeagueAdded,
}: ActionButtonsProps) {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const handleCloseDialog = () => setOpenDialog(null);

  return (
    <>
      <ButtonGroup>
        <Button variant="brandDark" onClick={() => setOpenDialog("league")}>
          Add League
        </Button>
      </ButtonGroup>

      {/* Add League Dialog */}
      <Dialog open={openDialog === "league"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Create League</DialogTitle>
            <DialogDescription className="text-gray-200">
              Create a new league submission. Include details about the sport, venue, dates, schedule, and pricing. Sports and venues can be new or existing.
            </DialogDescription>
          </DialogHeader>
          <AddLeagueForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
