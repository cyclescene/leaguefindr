import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddLeagueForm } from "@/components/forms/AddLeagueForm";
import { useOrganization } from "@/hooks/useOrganizations";
import { LeagueFormProvider, type FormMode } from "@/context/LeagueFormContext";
import type { AddLeagueFormData } from "@/lib/schemas/leagues";
import { useState } from "react";

interface SubmitLeagueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: () => void;
  prePopulatedFormData?: AddLeagueFormData;
  isEditingDraft?: boolean;
  editingDraftId?: number;
  isEditingTemplate?: boolean;
  editingTemplateId?: number;
  isViewingLeague?: boolean;
  viewingLeagueId?: number;
  viewingLeagueStatus?: string;
  viewingLeagueRejectionReason?: string | null;
  onLeagueSubmitted?: () => void;
  refetchDrafts?: () => Promise<any>;
  refetchTemplates?: () => Promise<any>;
  refetchLeagues?: () => Promise<any>;
  organizationName?: string;
}

export function SubmitLeagueDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
  prePopulatedFormData,
  isEditingDraft,
  editingDraftId,
  isEditingTemplate,
  editingTemplateId,
  isViewingLeague,
  viewingLeagueId,
  viewingLeagueStatus,
  viewingLeagueRejectionReason,
  onLeagueSubmitted,
  refetchDrafts,
  refetchTemplates,
  refetchLeagues,
  organizationName: propOrganizationName,
}: SubmitLeagueDialogProps) {
  const { organization } = useOrganization(organizationId);
  const organizationName = propOrganizationName || organization?.org_name;
  const [mapboxDropdownOpen, setMapboxDropdownOpen] = useState(false);

  const handleClose = () => onOpenChange(false);

  const handleSaveAsTemplate = (formData: AddLeagueFormData) => {
    // Just pass the form data and open the create template dialog
    // The parent component will handle the template creation
    onSuccess?.();
  };

  // Determine form mode based on props
  const getFormMode = (): FormMode => {
    if (isViewingLeague) return 'view';
    if (isEditingDraft) return 'edit-draft';
    if (isEditingTemplate) return 'edit-template';
    return 'new';
  };

  const formMode = getFormMode();
  const formContextValue = {
    mode: formMode,
    draftId: editingDraftId,
    templateId: editingTemplateId,
    leagueId: viewingLeagueId,
    leagueStatus: viewingLeagueStatus,
    leagueRejectionReason: viewingLeagueRejectionReason,
    prePopulatedFormData,
    organizationId,
    organizationName,
    onSuccess,
    onClose: handleClose,
    onLeagueSubmitted,
    refetchDrafts,
    refetchTemplates,
    refetchLeagues,
  };

  const dialogTitle = {
    'new': 'Submit League',
    'edit-draft': 'Edit Draft',
    'edit-template': 'Edit Template',
    'create-template': 'Create Template',
    'view': 'View League Submission',
    'admin-review': 'Review League Submission',
  }[formMode];

  const dialogDescription = {
    'new': 'Create a new league submission. Include details about the sport, dates, schedule, and pricing.',
    'edit-draft': 'Continue editing your league draft.',
    'edit-template': 'Update this template configuration to be reused for future league submissions.',
    'create-template': 'Save a league configuration as a reusable template for future submissions.',
    'view': 'Review the submitted league details.',
    'admin-review': 'Review and approve/reject the submitted league.',
  }[formMode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Block closing when dropdown is open
          if (mapboxDropdownOpen) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
          <DialogTitle className="text-white">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-gray-200">{dialogDescription}</DialogDescription>
        </DialogHeader>
        <LeagueFormProvider value={formContextValue}>
          <AddLeagueForm onSaveAsTemplate={handleSaveAsTemplate} onMapboxDropdownStateChange={setMapboxDropdownOpen} />
        </LeagueFormProvider>
      </DialogContent>
    </Dialog>
  );
}
