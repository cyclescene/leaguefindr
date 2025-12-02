'use client'

import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { DraftActions } from "./DraftActions"
import type { AdminDraft } from "@/hooks/useAdminDrafts"

interface AdminDraftsTableProps {
  drafts: AdminDraft[]
  isLoading?: boolean
  onView: (draft: AdminDraft) => void
  onSort?: (column: string, order: 'asc' | 'desc') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function AdminDraftsTable({ drafts, isLoading, onView, onSort, sortBy, sortOrder }: AdminDraftsTableProps) {
  const handleSort = (column: string) => {
    if (!onSort) return
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    onSort(column, newOrder)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 opacity-50" />
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">Loading drafts and templates...</p>
      </div>
    )
  }

  if (!drafts || drafts.length === 0) {
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
              Draft Name
              <SortIcon column="name" />
            </div>
          </TableHead>
          <TableHead>Type</TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('created_at')}
          >
            <div className="flex items-center gap-2">
              Created
              <SortIcon column="created_at" />
            </div>
          </TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drafts.map((draft) => (
          <TableRow key={draft.id} className="hover:bg-neutral-50">
            <TableCell className="font-medium">{draft.name || `Draft #${draft.id}`}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded text-xs font-medium ${draft.type === 'draft'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
                }`}>
                {draft.type === 'draft' ? 'Draft' : 'Template'}
              </span>
            </TableCell>
            <TableCell className="text-sm">{new Date(draft.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <DraftActions
                draft={draft}
                onView={onView}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
