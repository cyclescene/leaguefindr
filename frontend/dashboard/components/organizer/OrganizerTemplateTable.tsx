import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import { OrganizerTemplateTableRow } from "./OrganizerTemplateTableRow";
import type { Template } from "@/types/leagues";

interface OrganizerTemplateTableProps {
  templates: Template[];
  onEdit: (templateId: number) => void;
  onUse: (templateId: number) => void;
  onDelete: (templateId: number) => void;
}

export function OrganizerTemplateTable({
  templates,
  onEdit,
  onUse,
  onDelete,
}: OrganizerTemplateTableProps) {
  return (
    <Table className="w-full bg-white rounded-lg shadow-md">
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead>Sport</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => (
          <OrganizerTemplateTableRow
            key={template.id}
            template={template}
            onEdit={onEdit}
            onUse={onUse}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
