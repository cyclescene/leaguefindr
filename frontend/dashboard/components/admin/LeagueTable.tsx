import { Table, TableHead, TableHeader, TableRow, TableBody } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { LeagueTableRow } from "./LeagueTableRow";
import { useAdminTable } from "@/context/AdminTableContext";

interface League {
  id: number;
  name: string;
  organizationName: string;
  sport: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}

interface LeagueTableProps {
  leagues: League[];
  onView: (leagueId: number) => void;
  onApprove: (leagueId: number) => void;
  onReject: (leagueId: number) => void;
  onSaveAsDraft: (leagueData: Record<string, unknown>, name?: string) => void;
  onSaveAsTemplate: (leagueData: Record<string, unknown>, name?: string) => void;
  tableType?: 'leagues' | 'pending-leagues';
}

interface SortIconProps {
  column: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function SortIcon({ column, sortBy, sortOrder }: SortIconProps) {
  if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
  return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
}

export function LeagueTable({ leagues, onView, onApprove, onReject, onSaveAsDraft, onSaveAsTemplate, tableType = 'leagues' }: LeagueTableProps) {
  const { state, toggleSort } = useAdminTable(tableType as 'leagues' | 'pending-leagues');

  if (!leagues || leagues.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">No leagues found</p>
      </div>
    );
  }

  return (
    <Table className="w-full bg-white rounded-lg shadow-md">
      <TableHeader>
        <TableRow>
          <TableHead>League Name</TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => toggleSort('organizationName')}
          >
            <div className="w-60 flex items-center gap-2">
              League Org Name
              <SortIcon column="organizationName" sortBy={state.displaySortBy || state.sortBy} sortOrder={state.sortOrder} />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => toggleSort('sport')}
          >
            <div className="w-40 flex items-center gap-2">
              Sport
              <SortIcon column="sport" sortBy={state.displaySortBy || state.sortBy} sortOrder={state.sortOrder} />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => toggleSort('gender')}
          >
            <div className="flex items-center gap-2">
              Gender
              <SortIcon column="gender" sortBy={state.displaySortBy || state.sortBy} sortOrder={state.sortOrder} />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => toggleSort('startDate')}
          >
            <div className="w-32 flex items-center gap-2">
              Start Date
              <SortIcon column="startDate" sortBy={state.displaySortBy || state.sortBy} sortOrder={state.sortOrder} />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => toggleSort('venue')}
          >
            <div className="w-52 flex items-center gap-2">
              Venue
              <SortIcon column="venue" sortBy={state.displaySortBy || state.sortBy} sortOrder={state.sortOrder} />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => toggleSort('dateSubmitted')}
          >
            <div className="flex items-center gap-2">
              Date Submitted
              <SortIcon column="dateSubmitted" sortBy={state.displaySortBy || state.sortBy} sortOrder={state.sortOrder} />
            </div>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leagues.map((league) => (
          <LeagueTableRow
            key={league.id}
            league={league}
            onView={onView}
            onApprove={onApprove}
            onReject={onReject}
            onSaveAsDraft={onSaveAsDraft}
            onSaveAsTemplate={onSaveAsTemplate}
          />
        ))}
      </TableBody>
    </Table>
  );
}
