import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrganizerLeagueActions } from "./OrganizerLeagueActions";
import { truncate } from "@/lib/utils";
import type { SubmittedLeague } from "@/hooks/useDrafts";

interface OrganizerLeagueTableRowProps {
  league: SubmittedLeague;
  onView: (league: any) => void;
  onSaveAsDraft: (leagueData: any, name?: string) => void;
  onSaveAsTemplate: (leagueData: any, name?: string) => void;
}

export function OrganizerLeagueTableRow({
  league,
  onView,
  onSaveAsDraft,
  onSaveAsTemplate,
}: OrganizerLeagueTableRowProps) {
  return (
    <TableRow>
      <TableCell title={league.league_name}>{truncate(league.league_name, 20)}</TableCell>
      <TableCell title={league.form_data?.sport_name}>{truncate(league.form_data?.sport_name || 'Unknown', 20)}</TableCell>
      <TableCell>{league.gender}</TableCell>
      <TableCell>{(() => {
        const [year, month, day] = league.season_start_date.split('-')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString()
      })()}</TableCell>
      <TableCell title={league.form_data?.venue_name}>{truncate(league.form_data?.venue_name || 'Unknown', 20)}</TableCell>
      <TableCell>{new Date(league.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <StatusBadge status={league.status} />
      </TableCell>
      <TableCell>
        <OrganizerLeagueActions
          leagueId={league.id}
          leagueData={league}
          onView={onView}
          onSaveAsDraft={onSaveAsDraft}
          onSaveAsTemplate={onSaveAsTemplate}
        />
      </TableCell>
    </TableRow>
  );
}
