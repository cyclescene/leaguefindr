import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import { OrganizerDraftTableRow } from "./OrganizerDraftTableRow";

interface Draft {
  id: number;
  name: string;
  dateCreated: string;
}

interface OrganizerDraftTableProps {
  drafts: Draft[];
  onEdit: (draftId: number) => void;
  onDelete: (draftId: number) => void;
}

export function OrganizerDraftTable({
  drafts,
  onEdit,
  onDelete,
}: OrganizerDraftTableProps) {
  return (
    <Table className="w-full bg-white rounded-lg shadow-md">
      <TableCaption>Your League Drafts</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Draft Name</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drafts.map((draft) => (
          <OrganizerDraftTableRow
            key={draft.id}
            draft={draft}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
