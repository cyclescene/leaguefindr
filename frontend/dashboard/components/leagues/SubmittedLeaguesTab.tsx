import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrganizerLeagueTable } from "@/components/organizer/OrganizerLeagueTable";
import { useOrganizerTable } from "@/context/OrganizerTableContext";
import type { SubmittedLeague } from "@/hooks/useDrafts";
import { useMemo } from "react";

interface SubmittedLeaguesTabProps {
  leagues: SubmittedLeague[];
  onViewLeague: (league: any) => void;
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
  // Get sort state from context
  const { state, setSearchQuery, setFilterValue } = useOrganizerTable('leagues');

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(leagues.map(l => l.status).filter(Boolean)))
  }, [leagues])

  return (
    <TabsContent value="submitted">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Input
          placeholder="Search by league name, sport, or venue..."
          value={state.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-white"
        />
        <Select value={state.filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-full md:w-48 bg-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status || ''}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
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
