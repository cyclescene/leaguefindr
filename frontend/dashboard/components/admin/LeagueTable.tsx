import { Table, TableCaption, TableHead, TableHeader, TableRow, TableBody } from "@/components/ui/table";
import { LeagueTableRow } from "./LeagueTableRow";

interface League {
  id: number;
  name: string;
  organizationName: string;
  sport: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}

interface LeagueTableProps {
  leagues: League[];
  onView: (leagueId: number) => void;
  onApprove: (leagueId: number) => void;
  onReject: (leagueId: number) => void;
}

export function LeagueTable({ leagues, onView, onApprove, onReject }: LeagueTableProps) {
  return (
    <Table className="w-full bg-white rounded-lg shadow-md">
      <TableCaption>Submitted Leagues</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>League Name</TableHead>
          <TableHead>League Org Name</TableHead>
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
          <LeagueTableRow
            key={league.id}
            league={league}
            onView={onView}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </TableBody>
    </Table>
  );
}
