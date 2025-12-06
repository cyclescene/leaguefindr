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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useOrganizerTable } from "@/context/OrganizerTableContext";
import type { SubmittedLeague } from "@/hooks/useDrafts";

interface OrganizerLeagueTableProps {
  leagues: SubmittedLeague[];
  onView: (leagueId: number) => void;
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

  // Filter and sort leagues
  const filteredAndSortedLeagues = useMemo(() => {
    let result = [...leagues]

    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      result = result.filter(league =>
        league.league_name?.toLowerCase().includes(query) ||
        league.form_data?.sport_name?.toLowerCase().includes(query) ||
        league.form_data?.venue_name?.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (state.filterValue !== 'all') {
      result = result.filter(league => league.status === state.filterValue)
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any

      switch (state.sortBy) {
        case 'name':
          aVal = a.league_name || ''
          bVal = b.league_name || ''
          break
        case 'sport':
          aVal = a.form_data?.sport_name || ''
          bVal = b.form_data?.sport_name || ''
          break
        case 'status':
          aVal = a.status || ''
          bVal = b.status || ''
          break
        case 'date':
          aVal = new Date(a.created_at || 0).getTime()
          bVal = new Date(b.created_at || 0).getTime()
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
  }, [leagues, state.searchQuery, state.filterValue, state.sortBy, state.sortOrder])

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(leagues.map(l => l.status).filter(Boolean)))
  }, [leagues])

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by league name, sport, or venue..."
          value={state.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-white"
        />
        <Select value={state.filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-full md:w-48 bg-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status || ''}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
