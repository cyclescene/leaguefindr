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
import type { Template } from "@/types/leagues";

interface OrganizerTemplateTableRowProps {
  template: Template;
  onEdit: (templateId: number) => void;
  onUse: (templateId: number) => void;
  onDelete: (templateId: number) => void;
}

export function OrganizerTemplateTableRow({
  template,
  onEdit,
  onUse,
  onDelete,
}: OrganizerTemplateTableRowProps) {
  return (
    <TableRow>
      <TableCell>{template.name}</TableCell>
      <TableCell>{template.sport}</TableCell>
      <TableCell>{template.gender}</TableCell>
      <TableCell>{template.dateCreated}</TableCell>
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
              <DropdownMenuItem onClick={() => onUse(template.id)}>
                Use
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(template.id)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(template.id)}
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
