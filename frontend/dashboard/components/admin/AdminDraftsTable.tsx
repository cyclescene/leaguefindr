'use client'

import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useMemo } from "react"
import { DraftActions } from "./DraftActions"
import type { AdminDraft } from "@/hooks/useAdminDrafts"
import { useAdminTable } from "@/context/AdminTableContext"

interface AdminDraftsTableProps {
  drafts: AdminDraft[]
  isLoading?: boolean
  onView: (draft: AdminDraft) => void
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

export function AdminDraftsTable({ drafts, isLoading, onView }: AdminDraftsTableProps) {
  const { state, toggleSort } = useAdminTable('drafts')

  const sortedDrafts = useMemo(() => {
    const sorted = [...drafts]
    sorted.sort((a, b) => {
      let aVal: any = a[state.sortBy as keyof AdminDraft]
      let bVal: any = b[state.sortBy as keyof AdminDraft]

      // Handle date sorting
      if (state.sortBy === 'created_at') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      // Handle string sorting
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return state.sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return state.sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [drafts, state.sortBy, state.sortOrder])
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
    <Table className="w-full bg-white rounded-lg shadow-md">
      <TableHeader>
        <TableRow>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => toggleSort('name')}
          >
            <div className="flex items-center gap-2">
              Draft Name
              <SortIcon column="name" sortBy={state.sortBy} sortOrder={state.sortOrder} />
            </div>
          </TableHead>
          <TableHead>Type</TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => toggleSort('created_at')}
          >
            <div className="flex items-center gap-2">
              Created
              <SortIcon column="created_at" sortBy={state.sortBy} sortOrder={state.sortOrder} />
            </div>
          </TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedDrafts.map((draft) => (
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
