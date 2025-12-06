'use client'

import { useMemo } from 'react'
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { OrganizerDraftAndTemplateTableRow } from "./OrganizerDraftAndTemplateTableRow"
import { useOrganizerTable } from "@/context/OrganizerTableContext"
import type { Draft } from "@/hooks/useDrafts"

interface OrganizerDraftsAndTemplatesTableProps {
  drafts: Draft[]
  templates: Draft[]
  isLoading?: boolean
  onEditDraft: (draftId: number) => void
  onDeleteDraft: (draftId: number) => void
  onEditTemplate: (templateId: number) => void
  onUseTemplate: (templateId: number) => void
  onDeleteTemplate: (templateId: number) => void
}

interface SortIconProps {
  column: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

function SortIcon({ column, sortBy, sortOrder }: SortIconProps) {
  if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 opacity-50" />
  return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
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
}: OrganizerDraftsAndTemplatesTableProps) {
  const { state, setSearchQuery, setFilterValue, toggleSort } = useOrganizerTable('drafts-templates')

  // Combine drafts and templates - they're already Draft types with type property set
  const items: Draft[] = [...drafts, ...templates]

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]

    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      result = result.filter(item =>
        item.name?.toLowerCase().includes(query)
      )
    }

    // Filter by type if not 'all'
    if (state.filterValue !== 'all') {
      result = result.filter(item => item.type === state.filterValue)
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any

      switch (state.sortBy) {
        case 'name':
          aVal = a.name || ''
          bVal = b.name || ''
          break
        case 'created':
          aVal = new Date(a.dateCreated || a.dateSubmitted || 0).getTime()
          bVal = new Date(b.dateCreated || b.dateSubmitted || 0).getTime()
          break
        case 'type':
          aVal = a.type || ''
          bVal = b.type || ''
          break
        default:
          return 0
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
        return state.sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return state.sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return result
  }, [items, state.searchQuery, state.filterValue, state.sortBy, state.sortOrder])

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
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by name..."
          value={state.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-white"
        />
        <Select value={state.filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-full md:w-48 bg-white">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="template">Templates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table className="mt-4 w-full bg-white rounded-lg shadow-md">
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-neutral-100 select-none"
              onClick={() => toggleSort('name')}
            >
              <div className="flex items-center gap-2">
                Name
                <SortIcon column="name" sortBy={state.sortBy} sortOrder={state.sortOrder} />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-neutral-100 select-none"
              onClick={() => toggleSort('type')}
            >
              <div className="flex items-center gap-2">
                Type
                <SortIcon column="type" sortBy={state.sortBy} sortOrder={state.sortOrder} />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-neutral-100 select-none"
              onClick={() => toggleSort('created')}
            >
              <div className="flex items-center gap-2">
                Created
                <SortIcon column="created" sortBy={state.sortBy} sortOrder={state.sortOrder} />
              </div>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedItems.length > 0 ? (
            filteredAndSortedItems.map((item) => (
              <OrganizerDraftAndTemplateTableRow
                key={`${item.type}-${item.id}`}
                item={item}
                onEditDraft={onEditDraft}
                onDeleteDraft={onDeleteDraft}
                onEditTemplate={onEditTemplate}
                onUseTemplate={onUseTemplate}
                onDeleteTemplate={onDeleteTemplate}
              />
            ))
          ) : (
            <TableRow>
              <TableHead colSpan={4} className="text-center py-8 text-neutral-500">
                No drafts or templates found matching your search criteria
              </TableHead>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
