'use client'

import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Copy, Check, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useState } from "react"
import type { AdminOrganization } from "@/hooks/useAdminOrganizations"

interface OrganizationsTableProps {
  organizations: AdminOrganization[]
  isLoading?: boolean
  onSort?: (column: string, order: 'asc' | 'desc') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function OrganizationsTable({ organizations, isLoading, onSort, sortBy, sortOrder }: OrganizationsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

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
        <p className="text-neutral-600">Loading organizations...</p>
      </div>
    )
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">No organizations found</p>
      </div>
    )
  }

  return (
    <Table className="mt-4 w-full bg-white rounded-lg shadow-md">
      <TableHeader>
        <TableRow>
          <TableHead className="w-32">ID</TableHead>
          <TableHead
            className="w-96 cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('org_name')}
          >
            <div className="flex items-center gap-2">
              Name
              <SortIcon column="org_name" />
            </div>
          </TableHead>
          <TableHead className="w-96">Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Website</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id} className="hover:bg-neutral-50">
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm truncate" title={org.id}>{org.id.substring(0, 8)}...</span>
                <button
                  onClick={() => handleCopyId(org.id)}
                  className="p-1 hover:bg-neutral-200 rounded transition-colors cursor-pointer"
                  title="Copy ID"
                >
                  {copiedId === org.id ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-neutral-500 hover:text-neutral-700" />
                  )}
                </button>
              </div>
            </TableCell>
            <TableCell className="font-medium">{org.org_name ? (org.org_name.length > 40 ? org.org_name.substring(0, 40) + '...' : org.org_name) : '-'}</TableCell>
            <TableCell>{org.org_email || '-'}</TableCell>
            <TableCell>{org.org_phone_number || '-'}</TableCell>
            <TableCell title={org.org_address || undefined}>
              {org.org_address ? (org.org_address.length > 40 ? org.org_address.substring(0, 40) + '...' : org.org_address) : '-'}
            </TableCell>
            <TableCell>
              {org.org_url ? (
                <a href={org.org_url} target="_blank" rel="noopener noreferrer" className="text-brand-dark hover:underline cursor-pointer">
                  {new URL(org.org_url).hostname}
                </a>
              ) : (
                '-'
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
