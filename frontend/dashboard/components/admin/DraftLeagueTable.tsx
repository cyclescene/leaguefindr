import { Table, TableCaption, TableHead, TableHeader, TableRow, TableBody } from "@/components/ui/table";
import { DraftLeagueTableRow } from "./DraftLeagueTableRow";
import type { AdminDraft } from "@/hooks/useAdminDrafts";

interface DraftLeagueTableProps {
  drafts: AdminDraft[];
  onView: (draft: AdminDraft) => void;
}

export function DraftLeagueTable({ drafts, onView }: DraftLeagueTableProps) {
  if (!drafts || drafts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">No draft leagues found</p>
      </div>
    );
  }

  return (
    <Table className="w-full bg-white rounded-lg shadow-md">
      <TableCaption>Draft Leagues</TableCaption>
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
        {drafts.map((draft) => (
          <DraftLeagueTableRow
            key={draft.id}
            draft={draft}
            onView={onView}
          />
        ))}
      </TableBody>
    </Table>
  );
}
