'use client'

import { TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EllipsisVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Draft } from "@/types/leagues"
import type { Template } from "@/types/leagues"

type DraftOrTemplate = (Draft & { type: 'draft' }) | (Template & { type: 'template' })

interface OrganizerDraftAndTemplateTableRowProps {
  item: DraftOrTemplate
  onEditDraft: (draftId: number) => void
  onDeleteDraft: (draftId: number) => void
  onEditTemplate: (templateId: number) => void
  onUseTemplate: (templateId: number) => void
  onDeleteTemplate: (templateId: number) => void
}

export function OrganizerDraftAndTemplateTableRow({
  item,
  onEditDraft,
  onDeleteDraft,
  onEditTemplate,
  onUseTemplate,
  onDeleteTemplate,
}: OrganizerDraftAndTemplateTableRowProps) {
  const isDraft = item.type === 'draft'
  const name = isDraft ? (item as Draft).name || `Draft #${item.id}` : (item as Template).name || `Template #${item.id}`
  const created = new Date(item.created_at).toLocaleDateString()
  const typeBadgeColor = isDraft ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
  const typeLabel = isDraft ? 'Draft' : 'Template'

  return (
    <TableRow className="hover:bg-neutral-50">
      <TableCell className="font-medium">{name}</TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded text-xs font-medium ${typeBadgeColor}`}>
          {typeLabel}
        </span>
      </TableCell>
      <TableCell className="text-sm">{created}</TableCell>
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
              {isDraft ? (
                <>
                  <DropdownMenuItem onClick={() => onEditDraft(item.id)}>
                    Continue Editing
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteDraft(item.id)}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onUseTemplate(item.id)}>
                    Use Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditTemplate(item.id)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteTemplate(item.id)}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
