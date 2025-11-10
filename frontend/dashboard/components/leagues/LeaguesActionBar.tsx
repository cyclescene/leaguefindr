import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmittedLeaguesTab } from "./SubmittedLeaguesTab";
import { DraftsTab } from "./DraftsTab";
import { TemplatesTab } from "./TemplatesTab";
import type { League, Template, Draft } from "@/types/leagues";

interface LeaguesActionBarProps {
  onCreateTemplate: () => void;
  onSubmitLeague: () => void;
  submittedLeagues: League[];
  displayDrafts: Draft[];
  displayTemplates: Template[];
  submittedLeaguesLoading?: boolean;
  draftsLoading: boolean;
  templatesLoading: boolean;
  onViewLeague: (leagueId: number) => void;
  onEditTemplate: (templateId: number) => void;
  onUseTemplate: (templateId: number) => void;
  onDeleteTemplate: (templateId: number) => void;
  onEditDraft: (draftId: number) => void;
  onDeleteDraft: (draftId: number) => void;
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
}: LeaguesActionBarProps) {
  return (
    <Tabs defaultValue="submitted">
      <div className="flex flex-row w-full justify-between items-center mb-6">
        <TabsList>
          <TabsTrigger value="submitted">Submitted Leagues</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <ButtonGroup>
          <Button variant="brandDark" onClick={onCreateTemplate}>
            Create Template
          </Button>
          <Button variant="brandDark" onClick={onSubmitLeague}>
            Submit League
          </Button>
        </ButtonGroup>
      </div>

      <SubmittedLeaguesTab
        leagues={submittedLeagues}
        onViewLeague={onViewLeague}
        onSubmitLeague={onSubmitLeague}
      />

      <DraftsTab
        drafts={displayDrafts}
        isLoading={draftsLoading}
        onEditDraft={onEditDraft}
        onDeleteDraft={onDeleteDraft}
        onSubmitLeague={onSubmitLeague}
      />

      <TemplatesTab
        templates={displayTemplates}
        isLoading={templatesLoading}
        onEditTemplate={onEditTemplate}
        onUseTemplate={onUseTemplate}
        onDeleteTemplate={onDeleteTemplate}
        onCreateTemplate={onCreateTemplate}
      />
    </Tabs>
  );
}
