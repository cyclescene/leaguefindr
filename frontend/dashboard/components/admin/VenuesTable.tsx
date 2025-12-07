'use client'

import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { AdminVenue } from "@/hooks/useAdminVenues"
import { useAdminTable } from "@/context/AdminTableContext"

interface VenuesTableProps {
  venues: AdminVenue[]
  isLoading?: boolean
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

export function VenuesTable({ venues, isLoading }: VenuesTableProps) {
  const { state, toggleSort } = useAdminTable('venues')
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">Loading venues...</p>
      </div>
    )
  }

  if (!venues || venues.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">No venues found</p>
      </div>
    )
  }

  return (
    <Table className="w-full bg-white rounded-lg shadow-md">
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => toggleSort('name')}
          >
            <div className="flex items-center gap-2">
              Name
              <SortIcon column="name" sortBy={state.sortBy} sortOrder={state.sortOrder} />
            </div>
          </TableHead>
          <TableHead>Address</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {venues.map((venue) => (
          <TableRow key={venue.id} className="hover:bg-neutral-50">
            <TableCell className="font-mono text-sm">{venue.id}</TableCell>
            <TableCell className="font-medium">{venue.name}</TableCell>
            <TableCell>{venue.address || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
