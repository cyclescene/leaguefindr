"use client"

import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronRight, Edit2, Trash2, Share2, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { ClerkUser } from "@/types/clerk";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateOrganizationForm } from "@/components/organizations/CreateOrganizationForm";
import { DeleteOrganizationDialog } from "@/components/organizations/DeleteOrganizationDialog";
import { AddLeagueForm } from "@/components/forms/AddLeagueForm";
import { useOrganization } from "@/hooks/useOrganizations";

function OrganizationDashboardContent() {
  const { user, isLoaded } = useUser() as { user: ClerkUser | null; isLoaded: boolean };
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeagueDialog, setShowLeagueDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const { organization, isLoading, error, mutate } = useOrganization(orgId);

  // Redirect to home if user doesn't have access (403 error)
  useEffect(() => {
    if (error && error.message.includes("403")) {
      router.push("/");
    }
  }, [error, router]);

  const handleEditSuccess = async () => {
    await mutate();
  };

  const handleCopyOrgId = async () => {
    try {
      await navigator.clipboard.writeText(orgId);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (error || (isLoaded && !isLoading && !organization)) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-light">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-dark mb-4">Error Loading Organization</h1>
            <p className="text-neutral-600 mb-8">
              {error?.message || "Organization not found"}
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-brand-dark hover:text-brand-dark/80 underline"
            >
              Go back to organizations
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4 text-sm mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="text-brand-dark hover:text-brand-dark/80 font-medium"
            >
              Organizations
            </button>
            <ChevronRight size={16} className="text-neutral-400" />
            <span className="text-neutral-600">{organization.org_name}</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowInviteDialog(true)}
              variant="brandDark"
              size="sm"
            >
              <Share2 size={16} className="mr-2" />
              Invite Members
            </Button>
            <Button
              onClick={() => setShowEditDialog(true)}
              variant="outline"
              size="sm"
              className="border-brand-dark text-brand-dark hover:bg-brand-light"
            >
              <Edit2 size={16} className="mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark mb-2">{organization.org_name}</h1>
          <p className="text-neutral-600">Organization Dashboard</p>
        </div>

        {organization.org_email && (
          <p className="text-neutral-600 mb-2">
            <strong>Email:</strong> {organization.org_email}
          </p>
        )}
        {organization.org_phone && (
          <p className="text-neutral-600 mb-2">
            <strong>Phone:</strong> {organization.org_phone}
          </p>
        )}
        {organization.org_url && (
          <p className="text-neutral-600 mb-8">
            <strong>Website:</strong> <a href={organization.org_url} target="_blank" rel="noopener noreferrer" className="text-brand-dark hover:underline">{organization.org_url}</a>
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-white rounded-lg p-6 border border-neutral-200">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">Leagues</h2>
            <p className="text-neutral-600 mb-4">Manage and create leagues for your organization</p>
            <button
              onClick={() => router.push(`/${orgId}/leagues`)}
              className="text-brand-dark hover:text-brand-dark/80 font-semibold"
            >
              View Leagues →
            </button>
          </div>

        </div>
      </main>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-dark">Edit Organization</DialogTitle>
            <DialogDescription>
              Update your organization details
            </DialogDescription>
          </DialogHeader>
          {organization && (
            <CreateOrganizationForm
              organization={{
                id: organization.id,
                org_name: organization.org_name,
                org_email: organization.org_email,
                org_phone: organization.org_phone,
                org_url: organization.org_url,
                org_address: organization.org_address,
              }}
              onSuccess={() => {
                handleEditSuccess();
                setShowEditDialog(false);
              }}
              onClose={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {organization && (
        <DeleteOrganizationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          organizationId={organization.id}
          organizationName={organization.org_name}
        />
      )}

      {/* Invite Members Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
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

      <Footer />
    </div>
  );
}

export default function OrganizationDashboard() {
  return <OrganizationDashboardContent />;
}
