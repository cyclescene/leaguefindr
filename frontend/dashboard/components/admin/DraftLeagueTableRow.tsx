import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { DraftActions } from "./DraftActions";
import type { AdminDraft } from "@/hooks/useAdminDrafts";

interface DraftLeagueTableRowProps {
  draft: AdminDraft;
  onView: (draft: AdminDraft) => void;
}

export function DraftLeagueTableRow({ draft, onView }: DraftLeagueTableRowProps) {
  return (
    <TableRow>
      <TableCell>{draft.name}</TableCell>
      <TableCell>{draft.form_data?.sport_name || 'Unknown'}</TableCell>
      <TableCell>{draft.form_data?.gender || 'N/A'}</TableCell>
      <TableCell>{draft.form_data?.season_start_date ? (() => {
        const [year, month, day] = draft.form_data.season_start_date.split('-')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString()
      })() : 'N/A'}</TableCell>
      <TableCell>{draft.form_data?.venue_name || 'N/A'}</TableCell>
      <TableCell>{new Date(draft.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <StatusBadge status={draft.type === 'draft' ? 'pending' : 'template'} />
      </TableCell>
      <TableCell>
        <DraftActions
          draft={draft}
          onView={onView}
        />
      </TableCell>
    </TableRow>
  );
}
