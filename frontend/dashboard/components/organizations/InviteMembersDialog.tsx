import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InviteMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

export function InviteMembersDialog({
  open,
  onOpenChange,
  orgId,
}: InviteMembersDialogProps) {
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleCopyOrgId = async () => {
    try {
      await navigator.clipboard.writeText(orgId);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-brand-dark">Invite Members</DialogTitle>
          <DialogDescription>
            Share your organization ID with others to invite them to join
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-2">
              Organization ID
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-neutral-100 border border-neutral-300 rounded px-3 py-2 text-sm font-mono text-neutral-700 break-all">
                {orgId}
              </div>
              <Button
                onClick={handleCopyOrgId}
                variant="outline"
                size="sm"
                className="border-brand-dark text-brand-dark hover:bg-brand-light"
              >
                {copiedToClipboard ? (
                  <>
                    <Check size={16} className="mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
            <p>
              Share this ID with team members so they can join your organization without needing approval.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
