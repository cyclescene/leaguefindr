import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrganizerLeagueActions } from "./OrganizerLeagueActions";
import { truncate } from "@/lib/utils";
import type { League } from "@/types/leagues";

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
      <TableCell title={league.name}>{truncate(league.name, 20)}</TableCell>
      <TableCell title={league.sport}>{truncate(league.sport, 20)}</TableCell>
      <TableCell>{league.gender}</TableCell>
      <TableCell>{league.startDate}</TableCell>
      <TableCell title={league.venue}>{truncate(league.venue, 20)}</TableCell>
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
