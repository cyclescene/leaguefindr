import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import { OrganizerLeagueTableRow } from "./OrganizerLeagueTableRow";
import type { SubmittedLeague } from "@/hooks/useDrafts";

interface OrganizerLeagueTableProps {
  leagues: SubmittedLeague[];
  onView: (leagueId: number) => void;
  onSaveAsDraft: (leagueData: any, name?: string) => void;
  onSaveAsTemplate: (leagueData: any, name?: string) => void;
}

export function OrganizerLeagueTable({
  leagues,
  onView,
  onSaveAsDraft,
  onSaveAsTemplate,
}: OrganizerLeagueTableProps) {
  return (
    <Table className="w-full bg-white rounded-lg shadow-md">
      <TableCaption>Your Submitted Leagues</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>League Name</TableHead>
          <TableHead>Sport</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Venue</TableHead>
          <TableHead>Date Submitted</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leagues.map((league) => (
          <OrganizerLeagueTableRow
            key={league.id}
            league={league}
            onView={onView}
            onSaveAsDraft={onSaveAsDraft}
            onSaveAsTemplate={onSaveAsTemplate}
          />
        ))}
      </TableBody>
    </Table>
  );
}
