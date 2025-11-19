"use client"

import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ClerkUser } from "@/types/clerk";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateOrganizationForm } from "@/components/organizations/CreateOrganizationForm";
import { DeleteOrganizationDialog } from "@/components/organizations/DeleteOrganizationDialog";
import { OrganizationHeader } from "@/components/organizations/OrganizationHeader";
import { OrganizationInfo } from "@/components/organizations/OrganizationInfo";
import { OrganizationActions } from "@/components/organizations/OrganizationActions";
import { InviteMembersDialog } from "@/components/organizations/InviteMembersDialog";
import { useOrganization } from "@/hooks/useOrganizations";

function OrganizationDashboardContent() {
  const { user, isLoaded } = useUser() as { user: ClerkUser | null; isLoaded: boolean };
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  const { organization, isLoading, error, refetch } = useOrganization(orgId);

  // Redirect to home if user doesn't have access (403 error)
  useEffect(() => {
    if (error && error.message.includes("403")) {
      router.push("/");
    }
  }, [error, router]);

  const handleEditSuccess = async () => {
    await refetch();
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

  if (isLoading || !organization) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <OrganizationHeader
          orgId={orgId}
          orgName={organization.org_name}
          onEditClick={() => setShowEditDialog(true)}
          onDeleteClick={() => setShowDeleteDialog(true)}
          onInviteClick={() => setShowInviteDialog(true)}
        />

        <OrganizationInfo
          name={organization.org_name}
          email={organization.org_email}
          phone={organization.org_phone}
          url={organization.org_url}
        />

        <OrganizationActions orgId={orgId} />
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

      <InviteMembersDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        orgId={orgId}
      />

      <Footer />
    </div>
  );
}

export default function OrganizationDashboard() {
  return <OrganizationDashboardContent />;
}
