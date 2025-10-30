import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DraftActionsProps {
  draftId: number;
  onView: (draftId: number) => void;
  onEdit: (draftId: number) => void;
  onDelete: (draftId: number) => void;
  onSubmit: (draftId: number) => void;
}

export function DraftActions({ draftId, onView, onEdit, onDelete, onSubmit }: DraftActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onView(draftId)}>View</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(draftId)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSubmit(draftId)}>Submit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(draftId)} className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
