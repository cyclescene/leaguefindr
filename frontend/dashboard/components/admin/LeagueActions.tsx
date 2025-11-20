import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface LeagueActionsProps {
  leagueId: number;
  status: string;
  onView: (leagueId: number) => void;
  onApprove: (leagueId: number) => void;
  onReject: (leagueId: number) => void;
}

export function LeagueActions({ leagueId, status, onView, onApprove, onReject }: LeagueActionsProps) {
  const canApprove = status !== "approved";
  const canReject = status !== "rejected";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onView(leagueId)}>View</DropdownMenuItem>
          {canApprove && (
            <DropdownMenuItem onClick={() => onApprove(leagueId)}>Approve</DropdownMenuItem>
          )}
          {canReject && (
            <DropdownMenuItem onClick={() => onReject(leagueId)}>Reject</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
