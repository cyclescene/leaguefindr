import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { OrganizerDraftTable } from "@/components/organizer/OrganizerDraftTable";
import type { Draft } from "@/types/leagues";

interface DraftsTabProps {
  drafts: Draft[];
  isLoading: boolean;
  onEditDraft: (draftId: number) => void;
  onDeleteDraft: (draftId: number) => void;
  onSubmitLeague: () => void;
}

export function DraftsTab({
  drafts,
  isLoading,
  onEditDraft,
  onDeleteDraft,
  onSubmitLeague,
}: DraftsTabProps) {
  return (
    <TabsContent value="drafts">
      {isLoading ? (
        <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-brand-dark" size={20} />
            <p className="text-neutral-600">Loading drafts...</p>
          </div>
        </div>
      ) : drafts.length > 0 ? (
        <OrganizerDraftTable
          drafts={drafts}
          onEdit={onEditDraft}
          onDelete={onDeleteDraft}
        />
      ) : (
        <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
          <p className="text-neutral-600 mb-4">
            You don't have any drafts. Start a new league submission to save a draft.
          </p>
          <Button variant="brandDark" onClick={onSubmitLeague}>
            Start New League
          </Button>
        </div>
      )}
    </TabsContent>
  );
}
