import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import { OrganizerTemplateTableRow } from "./OrganizerTemplateTableRow";

interface Template {
  id: number;
  name: string;
  sport: string;
  ageGroup: string;
  gender: string;
  dateCreated: string;
}

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
      <TableCaption>Your League Templates</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead>Sport</TableHead>
          <TableHead>Age Group</TableHead>
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
