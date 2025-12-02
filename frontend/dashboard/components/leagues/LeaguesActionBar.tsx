import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { SubmittedLeaguesTab } from "./SubmittedLeaguesTab";
import { DraftsAndTemplatesTab } from "./DraftsAndTemplatesTab";
import type { SubmittedLeague, Draft } from "@/hooks/useDrafts";

interface LeaguesActionBarProps {
  onCreateTemplate: () => void;
  onSubmitLeague: () => void;
  submittedLeagues: SubmittedLeague[];
  displayDrafts: Draft[];
  displayTemplates: Draft[];
  submittedLeaguesLoading?: boolean;
  draftsLoading: boolean;
  templatesLoading: boolean;
  onViewLeague: (leagueId: number) => void;
  onEditTemplate: (templateId: number) => void;
  onUseTemplate: (templateId: number) => void;
  onDeleteTemplate: (templateId: number) => void;
  onEditDraft: (draftId: number) => void;
  onDeleteDraft: (draftId: number) => void;
  onSaveAsDraft: (leagueData: any, name?: string) => void;
  onSaveAsTemplate: (leagueData: any, name?: string) => void;
}

export function LeaguesActionBar({
  onCreateTemplate,
  onSubmitLeague,
  submittedLeagues,
  displayDrafts,
  displayTemplates,
  submittedLeaguesLoading,
  draftsLoading,
  templatesLoading,
  onViewLeague,
  onEditTemplate,
  onUseTemplate,
  onDeleteTemplate,
  onEditDraft,
  onDeleteDraft,
  onSaveAsDraft,
  onSaveAsTemplate,
}: LeaguesActionBarProps) {
  return (
    <Tabs defaultValue="submitted">
      <div className="flex flex-row w-full justify-between items-center mb-6">
        <TabsList>
          <TabsTrigger value="submitted">Submitted Leagues ({submittedLeagues.length})</TabsTrigger>
          <TabsTrigger value="drafts-templates">Drafts & Templates ({displayDrafts.length + displayTemplates.length})</TabsTrigger>
        </TabsList>

        <ButtonGroup>
          <Button variant="brandDarkOutline" onClick={onSubmitLeague}>
            Create Template
          </Button>
          <Button variant="brandDark" onClick={onSubmitLeague}>
            <Plus className="w-4 h-4 mr-2" />
            Submit League
          </Button>
        </ButtonGroup>
      </div>

      <SubmittedLeaguesTab
        leagues={submittedLeagues}
        onViewLeague={onViewLeague}
        onSubmitLeague={onSubmitLeague}
        onSaveAsDraft={onSaveAsDraft}
        onSaveAsTemplate={onSaveAsTemplate}
      />

      <DraftsAndTemplatesTab
        drafts={displayDrafts}
        templates={displayTemplates}
        isLoading={draftsLoading || templatesLoading}
        onEditDraft={onEditDraft}
        onDeleteDraft={onDeleteDraft}
        onEditTemplate={onEditTemplate}
        onUseTemplate={onUseTemplate}
        onDeleteTemplate={onDeleteTemplate}
        onSubmitLeague={onSubmitLeague}
      />
    </Tabs>
  );
}
