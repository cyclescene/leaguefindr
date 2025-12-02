import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { OrganizerDraftsAndTemplatesTable } from "@/components/organizer/OrganizerDraftsAndTemplatesTable";
import type { Draft } from "@/types/leagues";
import type { Template } from "@/types/leagues";

interface DraftsAndTemplatesTabProps {
  drafts: Draft[];
  templates: Template[];
  isLoading: boolean;
  onEditDraft: (draftId: number) => void;
  onDeleteDraft: (draftId: number) => void;
  onEditTemplate: (templateId: number) => void;
  onUseTemplate: (templateId: number) => void;
  onDeleteTemplate: (templateId: number) => void;
  onSubmitLeague: () => void;
}

export function DraftsAndTemplatesTab({
  drafts,
  templates,
  isLoading,
  onEditDraft,
  onDeleteDraft,
  onEditTemplate,
  onUseTemplate,
  onDeleteTemplate,
  onSubmitLeague,
}: DraftsAndTemplatesTabProps) {
  const hasItems = drafts.length > 0 || templates.length > 0;

  return (
    <TabsContent value="drafts-templates">
      {isLoading ? (
        <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-brand-dark" size={20} />
            <p className="text-neutral-600">Loading drafts and templates...</p>
          </div>
        </div>
      ) : hasItems ? (
        <OrganizerDraftsAndTemplatesTable
          drafts={drafts}
          templates={templates}
          onEditDraft={onEditDraft}
          onDeleteDraft={onDeleteDraft}
          onEditTemplate={onEditTemplate}
          onUseTemplate={onUseTemplate}
          onDeleteTemplate={onDeleteTemplate}
        />
      ) : (
        <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
          <p className="text-neutral-600 mb-4">
            You don't have any drafts or templates yet. Start a new league submission to save a draft.
          </p>
          <Button variant="brandDark" onClick={onSubmitLeague}>
            Start New League
          </Button>
        </div>
      )}
    </TabsContent>
  );
}
