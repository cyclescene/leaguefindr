'use client'

import { useMemo } from 'react'
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import { OrganizerLeagueTableRow } from "./OrganizerLeagueTableRow";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useOrganizerTable } from "@/context/OrganizerTableContext";
import type { SubmittedLeague } from "@/hooks/useDrafts";

interface OrganizerLeagueTableProps {
  leagues: SubmittedLeague[];
  onView: (league: any) => void;
  onSaveAsDraft: (leagueData: any, name?: string) => void;
  onSaveAsTemplate: (leagueData: any, name?: string) => void;
}

function SortIcon({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 opacity-50" />
  return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
}

export function OrganizerLeagueTable({
  leagues,
  onView,
  onSaveAsDraft,
  onSaveAsTemplate,
}: OrganizerLeagueTableProps) {
  const { state, setSearchQuery, setFilterValue, toggleSort } = useOrganizerTable('leagues')

  // Filter leagues (sorting is now server-side, only filter by status client-side)
  const filteredAndSortedLeagues = useMemo(() => {
    let result = [...leagues]

    // Filter by status (client-side only, status isn't part of search)
    if (state.filterValue !== 'all') {
      result = result.filter(league => league.status === state.filterValue)
    }

    return result
  }, [leagues, state.filterValue])

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(leagues.map(l => l.status).filter(Boolean)))
  }, [leagues])

  return (
    <div className="space-y-4">
      {/* Table */}
      <Table className="w-full bg-white rounded-lg shadow-md">
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-neutral-100 select-none"
              onClick={() => toggleSort('name')}
            >
              <div className="flex items-center gap-2">
                League Name
                <SortIcon column="name" sortBy={state.sortBy} sortOrder={state.sortOrder} />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-neutral-100 select-none"
              onClick={() => toggleSort('sport')}
            >
              <div className="flex items-center gap-2">
                Sport
                <SortIcon column="sport" sortBy={state.sortBy} sortOrder={state.sortOrder} />
              </div>
            </TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-neutral-100 select-none"
              onClick={() => toggleSort('date')}
            >
              <div className="flex items-center gap-2">
                Date Submitted
                <SortIcon column="date" sortBy={state.sortBy} sortOrder={state.sortOrder} />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-neutral-100 select-none"
              onClick={() => toggleSort('status')}
            >
              <div className="flex items-center gap-2">
                Status
                <SortIcon column="status" sortBy={state.sortBy} sortOrder={state.sortOrder} />
              </div>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedLeagues.length > 0 ? (
            filteredAndSortedLeagues.map((league) => (
              <OrganizerLeagueTableRow
                key={league.id}
                league={league}
                onView={onView}
                onSaveAsDraft={onSaveAsDraft}
                onSaveAsTemplate={onSaveAsTemplate}
              />
            ))
          ) : (
            <TableRow>
              <TableHead colSpan={8} className="text-center py-8 text-neutral-500">
                No leagues found matching your search criteria
              </TableHead>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
