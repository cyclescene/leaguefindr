"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export function DeleteOrganizationDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: DeleteOrganizationDialogProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmationText === organizationName;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/${organizationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete organization");
      }

      // Redirect to org hub after successful deletion
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmationText("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Organization</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the organization
            and remove all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2 bg-neutral-50 p-3 rounded-md">
            <p className="text-sm text-neutral-700">
              To confirm deletion of <span className="font-bold">{organizationName}</span>, type the organization name below:
            </p>
          </div>

          <Input
            type="text"
            placeholder={organizationName}
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            disabled={isDeleting}
            className="border-neutral-300 focus:ring-red-500 focus:border-red-500"
          />

          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
              className="border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Organization"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
