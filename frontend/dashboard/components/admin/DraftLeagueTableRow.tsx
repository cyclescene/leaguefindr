import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { DraftActions } from "./DraftActions";

interface Draft {
  id: number;
  name: string;
  sport: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}

interface DraftLeagueTableRowProps {
  draft: Draft;
  onView: (draftId: number) => void;
  onEdit: (draftId: number) => void;
  onDelete: (draftId: number) => void;
  onSubmit: (draftId: number) => void;
}

export function DraftLeagueTableRow({ draft, onView, onEdit, onDelete, onSubmit }: DraftLeagueTableRowProps) {
  return (
    <TableRow>
      <TableCell>{draft.name}</TableCell>
      <TableCell>{draft.sport}</TableCell>
      <TableCell>{draft.gender}</TableCell>
      <TableCell>{draft.startDate}</TableCell>
      <TableCell>{draft.venue}</TableCell>
      <TableCell>{draft.dateSubmitted}</TableCell>
      <TableCell>
        <StatusBadge status={draft.status} />
      </TableCell>
      <TableCell>
        <DraftActions
          draftId={draft.id}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onSubmit={onSubmit}
        />
      </TableCell>
    </TableRow>
  );
}
