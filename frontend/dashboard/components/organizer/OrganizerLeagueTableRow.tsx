import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrganizerLeagueActions } from "./OrganizerLeagueActions";

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
  rejection_reason?: string | null;
}

interface OrganizerLeagueTableRowProps {
  league: League;
  onView: (leagueId: number) => void;
}

export function OrganizerLeagueTableRow({
  league,
  onView,
}: OrganizerLeagueTableRowProps) {
  return (
    <TableRow>
      <TableCell>{league.name}</TableCell>
      <TableCell>{league.sport}</TableCell>
      <TableCell>{league.gender}</TableCell>
      <TableCell>{league.startDate}</TableCell>
      <TableCell>{league.venue}</TableCell>
      <TableCell>{league.dateSubmitted}</TableCell>
      <TableCell>
        <StatusBadge status={league.status} />
      </TableCell>
      <TableCell>
        <OrganizerLeagueActions leagueId={league.id} onView={onView} />
      </TableCell>
    </TableRow>
  );
}
