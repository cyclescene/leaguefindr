import { Table, TableHead, TableHeader, TableRow, TableBody } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { LeagueTableRow } from "./LeagueTableRow";

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
  onSaveAsDraft: (leagueData: any, name?: string) => void;
  onSaveAsTemplate: (leagueData: any, name?: string) => void;
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function LeagueTable({ leagues, onView, onApprove, onReject, onSaveAsDraft, onSaveAsTemplate, onSort, sortBy, sortOrder }: LeagueTableProps) {
  const handleSort = (column: string) => {
    if (!onSort) return;
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column, newOrder);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  if (!leagues || leagues.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-600">No leagues found</p>
      </div>
    );
  }

  return (
    <Table className="mt-4 w-full bg-white rounded-lg shadow-md">
      <TableHeader>
        <TableRow>
          <TableHead>League Name</TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('organizationName')}
          >
            <div className="w-60  flex items-center gap-2">
              League Org Name
              <SortIcon column="organizationName" />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('sport')}
          >
            <div className="w-40  flex items-center gap-2">
              Sport
              <SortIcon column="sport" />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('gender')}
          >
            <div className="flex items-center gap-2">
              Gender
              <SortIcon column="gender" />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('startDate')}
          >
            <div className="w-32 flex items-center gap-2">
              Start Date
              <SortIcon column="startDate" />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('venue')}
          >
            <div className="w-52 flex items-center gap-2">
              Venue
              <SortIcon column="venue" />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-neutral-100 select-none"
            onClick={() => handleSort('dateSubmitted')}
          >
            <div className="flex items-center gap-2">
              Date Submitted
              <SortIcon column="dateSubmitted" />
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
