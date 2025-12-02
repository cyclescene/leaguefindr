'use client'

import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { AdminSport } from "@/hooks/useAdminSports"

interface SportsTableProps {
  sports: AdminSport[]
  isLoading?: boolean
  onSort?: (column: string, order: 'asc' | 'desc') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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

export function SportsTable({ sports, isLoading, onSort, sortBy, sortOrder }: SportsTableProps) {
  const handleSort = (column: string) => {
    if (!onSort) return
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    onSort(column, newOrder)
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">Loading sports...</p>
      </div>
    )
  }

  if (!sports || sports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">No sports found</p>
      </div>
    )
  }

  return (
    <Table className="mt-4 w-auto bg-white rounded-lg shadow-md mx-auto">
      <TableHeader>
        <TableRow>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none w-24 text-center"
            onClick={() => handleSort('id')}
          >
            <div className="flex items-center justify-center gap-2">
              ID
              <SortIcon column="id" sortBy={sortBy} sortOrder={sortOrder} />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('name')}
          >
            <div className="flex items-center gap-2">
              Name
              <SortIcon column="name" sortBy={sortBy} sortOrder={sortOrder} />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sports.map((sport) => (
          <TableRow key={sport.id} className="hover:bg-neutral-50">
            <TableCell className="font-mono text-sm w-24">{sport.id}</TableCell>
            <TableCell className="font-medium w-40">{sport.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
