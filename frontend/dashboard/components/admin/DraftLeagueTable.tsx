import { Table, TableCaption, TableHead, TableHeader, TableRow, TableBody } from "@/components/ui/table";
import { DraftLeagueTableRow } from "./DraftLeagueTableRow";

interface Draft {
  id: number;
  name: string;
  sport: string;
  ageGroup: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}

interface DraftLeagueTableProps {
  drafts: Draft[];
  onView: (draftId: number) => void;
  onEdit: (draftId: number) => void;
  onDelete: (draftId: number) => void;
  onSubmit: (draftId: number) => void;
}

export function DraftLeagueTable({ drafts, onView, onEdit, onDelete, onSubmit }: DraftLeagueTableProps) {
  return (
    <Table className="w-full bg-white rounded-lg shadow-md">
      <TableCaption>Draft Leagues</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>League Name</TableHead>
          <TableHead>Sport</TableHead>
          <TableHead>Age Group</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Venue</TableHead>
          <TableHead>Date Submitted</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drafts.map((draft) => (
          <DraftLeagueTableRow
            key={draft.id}
            draft={draft}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onSubmit={onSubmit}
          />
        ))}
      </TableBody>
    </Table>
  );
}
