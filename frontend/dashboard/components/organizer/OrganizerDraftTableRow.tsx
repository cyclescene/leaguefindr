import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";

interface Draft {
  id: number;
  name: string;
  dateCreated: string;
}

interface OrganizerDraftTableRowProps {
  draft: Draft;
  onEdit: (draftId: number) => void;
  onDelete: (draftId: number) => void;
}

export function OrganizerDraftTableRow({
  draft,
  onEdit,
  onDelete,
}: OrganizerDraftTableRowProps) {
  return (
    <TableRow>
      <TableCell>{draft.name || `Draft #${draft.id}`}</TableCell>
      <TableCell>{draft.dateCreated}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onEdit(draft.id)}>
                Continue Editing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(draft.id)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
