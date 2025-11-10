import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddLeagueForm } from "@/components/forms/AddLeagueForm";
import { useOrganization } from "@/hooks/useOrganizations";
import type { AddLeagueFormData } from "@/lib/schemas/leagues";

interface SubmitLeagueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: () => void;
  prePopulatedFormData?: AddLeagueFormData;
}

export function SubmitLeagueDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
  prePopulatedFormData,
}: SubmitLeagueDialogProps) {
  const { organization } = useOrganization(organizationId);
  const organizationName = organization?.org_name;
  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
          <DialogTitle className="text-white">Submit League</DialogTitle>
          <DialogDescription className="text-gray-200">
            Create a new league submission. Include details about the sport,
            dates, schedule, and pricing.
          </DialogDescription>
        </DialogHeader>
        <AddLeagueForm
          organizationId={organizationId}
          organizationName={organizationName}
          onSuccess={onSuccess}
          onClose={handleClose}
          prePopulatedFormData={prePopulatedFormData}
          isEditingDraft={!!prePopulatedFormData}
        />
      </DialogContent>
    </Dialog>
  );
}
