'use client'

import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { OrganizerDraftAndTemplateTableRow } from "./OrganizerDraftAndTemplateTableRow"
import type { Draft } from "@/types/leagues"
import type { Template } from "@/types/leagues"

interface DraftOrTemplate extends Draft {
  type: 'draft'
}

interface DraftOrTemplate extends Template {
  type: 'template'
}

type DraftOrTemplate = (Draft & { type: 'draft' }) | (Template & { type: 'template' })

interface OrganizerDraftsAndTemplatesTableProps {
  drafts: Draft[]
  templates: Template[]
  isLoading?: boolean
  onEditDraft: (draftId: number) => void
  onDeleteDraft: (draftId: number) => void
  onEditTemplate: (templateId: number) => void
  onUseTemplate: (templateId: number) => void
  onDeleteTemplate: (templateId: number) => void
  onSort?: (column: string, order: 'asc' | 'desc') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function OrganizerDraftsAndTemplatesTable({
  drafts,
  templates,
  isLoading,
  onEditDraft,
  onDeleteDraft,
  onEditTemplate,
  onUseTemplate,
  onDeleteTemplate,
  onSort,
  sortBy,
  sortOrder,
}: OrganizerDraftsAndTemplatesTableProps) {
  const handleSort = (column: string) => {
    if (!onSort) return
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    onSort(column, newOrder)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 opacity-50" />
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  // Combine drafts and templates with type indicators
  const items: DraftOrTemplate[] = [
    ...drafts.map(d => ({ ...d, type: 'draft' as const })),
    ...templates.map(t => ({ ...t, type: 'template' as const })),
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">Loading...</p>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">No drafts or templates found</p>
      </div>
    )
  }

  return (
    <Table className="mt-4 w-full bg-white rounded-lg shadow-md">
      <TableHeader>
        <TableRow>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('name')}
          >
            <div className="flex items-center gap-2">
              Name
              <SortIcon column="name" />
            </div>
          </TableHead>
          <TableHead>Type</TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('created')}
          >
            <div className="flex items-center gap-2">
              Created
              <SortIcon column="created" />
            </div>
          </TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <OrganizerDraftAndTemplateTableRow
            key={`${item.type}-${item.id}`}
            item={item}
            onEditDraft={onEditDraft}
            onDeleteDraft={onDeleteDraft}
            onEditTemplate={onEditTemplate}
            onUseTemplate={onUseTemplate}
            onDeleteTemplate={onDeleteTemplate}
          />
        ))}
      </TableBody>
    </Table>
  )
}
