import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { OrganizerLeagueTable } from "@/components/organizer/OrganizerLeagueTable";
import type { SubmittedLeague } from "@/hooks/useDrafts";

interface SubmittedLeaguesTabProps {
  leagues: SubmittedLeague[];
  onViewLeague: (leagueId: number) => void;
  onSubmitLeague: () => void;
  onSaveAsDraft: (leagueData: any, name?: string) => void;
  onSaveAsTemplate: (leagueData: any, name?: string) => void;
}

export function SubmittedLeaguesTab({
  leagues,
  onViewLeague,
  onSubmitLeague,
  onSaveAsDraft,
  onSaveAsTemplate,
}: SubmittedLeaguesTabProps) {
  return (
    <TabsContent value="submitted">
      {leagues.length > 0 ? (
        <OrganizerLeagueTable
          leagues={leagues}
          onView={onViewLeague}
          onSaveAsDraft={onSaveAsDraft}
          onSaveAsTemplate={onSaveAsTemplate}
        />
      ) : (
        <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
          <p className="text-neutral-600 mb-4">
            You haven't submitted any leagues yet.
          </p>
          <Button variant="brandDark" onClick={onSubmitLeague}>
            Submit Your First League
          </Button>
        </div>
      )}
    </TabsContent>
  );
}
