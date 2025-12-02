import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { LeagueActions } from "./LeagueActions";
import { truncate } from "@/lib/utils";

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

interface LeagueTableRowProps {
  league: League & { [key: string]: any };
  onView: (leagueId: number) => void;
  onApprove: (leagueId: number) => void;
  onReject: (leagueId: number) => void;
  onSaveAsDraft: (leagueData: any, name?: string) => void;
  onSaveAsTemplate: (leagueData: any, name?: string) => void;
}

export function LeagueTableRow({
  league,
  onView,
  onApprove,
  onReject,
  onSaveAsDraft,
  onSaveAsTemplate,
}: LeagueTableRowProps) {
  return (
    <TableRow>
      <TableCell title={league.name}>{truncate(league.name, 20)}</TableCell>
      <TableCell title={league.organizationName}>{truncate(league.organizationName, 20)}</TableCell>
      <TableCell title={league.sport}>{truncate(league.sport, 20)}</TableCell>
      <TableCell>{league.gender}</TableCell>
      <TableCell>{league.startDate}</TableCell>
      <TableCell title={league.venue}>{truncate(league.venue, 20)}</TableCell>
      <TableCell>{league.dateSubmitted}</TableCell>
      <TableCell>
        <StatusBadge status={league.status} />
      </TableCell>
      <TableCell>
        <LeagueActions
          leagueId={league.id}
          leagueData={league}
          status={league.status}
          onView={onView}
          onApprove={onApprove}
          onReject={onReject}
          onSaveAsDraft={onSaveAsDraft}
          onSaveAsTemplate={onSaveAsTemplate}
        />
      </TableCell>
    </TableRow>
  );
}
