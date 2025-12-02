import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Button as DialogButton } from "@/components/ui/button";

interface LeagueActionsProps {
  leagueId: number;
  leagueData: any;
  status: string;
  onView: (leagueId: number) => void;
  onApprove: (leagueId: number) => void;
  onReject: (leagueId: number) => void;
  onSaveAsDraft: (leagueData: any, name?: string) => void;
  onSaveAsTemplate: (leagueData: any, name?: string) => void;
}

export function LeagueActions({
  leagueId,
  leagueData,
  status,
  onView,
  onApprove,
  onReject,
  onSaveAsDraft,
  onSaveAsTemplate
}: LeagueActionsProps) {
  const canApprove = status !== "approved";
  const canReject = status !== "rejected";
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  const handleSaveAsDraft = () => {
    onSaveAsDraft(leagueData, saveName || undefined);
    setSaveName("");
    setShowSaveAsDialog(false);
  };

  const handleSaveAsTemplate = () => {
    onSaveAsTemplate(leagueData, saveName || undefined);
    setSaveName("");
    setShowSaveAsDialog(false);
  };

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
        <DropdownMenuSeparator />
        <Dialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Save As...
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
              <DialogTitle className="text-white">Save League As</DialogTitle>
              <DialogDescription className="text-gray-200">
                Choose how you'd like to save this league for reuse
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="save-name" className="text-neutral-700">
                  Name (Optional)
                </Label>
                <Input
                  id="save-name"
                  placeholder="Enter a name for this draft/template"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-4">
                <DialogButton
                  variant="outline"
                  className="flex-1"
                  onClick={handleSaveAsDraft}
                >
                  Save as Draft
                </DialogButton>
                <DialogButton
                  variant="outline"
                  className="flex-1"
                  onClick={handleSaveAsTemplate}
                >
                  Save as Template
                </DialogButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
