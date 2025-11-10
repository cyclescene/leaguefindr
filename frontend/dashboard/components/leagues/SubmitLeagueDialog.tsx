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
  onLeagueSubmitted?: () => void;
  mutateDrafts?: () => Promise<any>;
  mutateTemplates?: () => Promise<any>;
  mutateLeagues?: () => Promise<any>;
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
  onLeagueSubmitted,
  mutateDrafts,
  mutateTemplates,
  mutateLeagues,
  organizationName: propOrganizationName,
}: SubmitLeagueDialogProps) {
  const { organization } = useOrganization(organizationId);
  const organizationName = propOrganizationName || organization?.org_name;
  const handleClose = () => onOpenChange(false);

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
    prePopulatedFormData,
    organizationId,
    organizationName,
    onSuccess,
    onClose: handleClose,
    onLeagueSubmitted,
    mutateDrafts,
    mutateTemplates,
    mutateLeagues,
  };

  const dialogTitle = {
    'new': 'Submit League',
    'edit-draft': 'Edit Draft',
    'edit-template': 'Edit Template',
    'view': 'View League Submission',
  }[formMode];

  const dialogDescription = {
    'new': 'Create a new league submission. Include details about the sport, dates, schedule, and pricing.',
    'edit-draft': 'Continue editing your league draft.',
    'edit-template': 'Update the template configuration.',
    'view': 'Review the submitted league details.',
  }[formMode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
          <DialogTitle className="text-white">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-gray-200">{dialogDescription}</DialogDescription>
        </DialogHeader>
        <LeagueFormProvider value={formContextValue}>
          <AddLeagueForm />
        </LeagueFormProvider>
      </DialogContent>
    </Dialog>
  );
}
