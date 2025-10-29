import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { LeagueActions } from "./LeagueActions";

interface League {
  id: number;
  name: string;
  organizationName: string;
  sport: string;
  ageGroup: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}

interface LeagueTableRowProps {
  league: League;
  onView: (leagueId: number) => void;
  onApprove: (leagueId: number) => void;
  onReject: (leagueId: number) => void;
}

export function LeagueTableRow({ league, onView, onApprove, onReject }: LeagueTableRowProps) {
  return (
    <TableRow>
      <TableCell>{league.name}</TableCell>
      <TableCell>{league.organizationName}</TableCell>
      <TableCell>{league.sport}</TableCell>
      <TableCell>{league.ageGroup}</TableCell>
      <TableCell>{league.gender}</TableCell>
      <TableCell>{league.startDate}</TableCell>
      <TableCell>{league.venue}</TableCell>
      <TableCell>{league.dateSubmitted}</TableCell>
      <TableCell>
        <StatusBadge status={league.status} />
      </TableCell>
      <TableCell>
        <LeagueActions
          leagueId={league.id}
          onView={onView}
          onApprove={onApprove}
          onReject={onReject}
        />
      </TableCell>
    </TableRow>
  );
}
