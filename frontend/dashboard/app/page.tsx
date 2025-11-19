"use client"

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import type { ClerkUser } from "@/types/clerk";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateOrganizationForm } from "@/components/organizations/CreateOrganizationForm";
import { JoinOrganizationForm } from "@/components/organizations/JoinOrganizationForm";
import { useUserOrganizations } from "@/hooks/useOrganizations";

function OrganizationHubContent() {
  const { user, isLoaded } = useUser() as { user: ClerkUser | null; isLoaded: boolean };
  const router = useRouter();
  const { organizations, isLoading: isLoadingOrgs, refetch } = useUserOrganizations();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

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

  const handleOrgClick = (orgId: string) => {
    router.push(`/${orgId}`);
  };

  const handleCreateOrgSuccess = (orgId: string) => {
    // Revalidate organizations list and redirect
    refetch();
    router.push(`/${orgId}`);
  };

  const handleJoinOrgSuccess = (orgId: string) => {
    // Revalidate organizations list and redirect
    refetch();
    router.push(`/${orgId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Your Organizations</h1>
          <p className="text-neutral-600">Select an organization or create a new one</p>
        </div>

        {isLoadingOrgs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-brand-dark" size={40} />
          </div>
        ) : organizations && organizations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {organizations.map((org) => (
                <Card
                  key={org.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleOrgClick(org.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-brand-dark">{org.org_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {org.org_email && <p className="text-sm text-neutral-600 mb-2">{org.org_email}</p>}
                    {org.org_phone && <p className="text-sm text-neutral-600">{org.org_phone}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold text-brand-dark mb-4">Create or Join an Organization</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="h-24 bg-brand-dark hover:bg-brand-dark/90 text-white flex flex-col items-center justify-center gap-2"
                >
                  <Plus size={24} />
                  <span>Create Organization</span>
                </Button>
                <Button
                  onClick={() => setShowJoinModal(true)}
                  variant="outline"
                  className="h-24 border-brand-dark text-brand-dark hover:bg-brand-light flex flex-col items-center justify-center gap-2"
                >
                  <Plus size={24} />
                  <span>Join Organization</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-brand-dark mb-4">Get Started</h2>
            <p className="text-neutral-600 mb-8">You're not part of any organizations yet.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-brand-dark hover:bg-brand-dark/90 text-white"
              >
                Create Organization
              </Button>
              <Button
                onClick={() => setShowJoinModal(true)}
                variant="outline"
                className="border-brand-dark text-brand-dark hover:bg-brand-light"
              >
                Join Organization
              </Button>
            </div>
          </div>
        )}
      </main>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-dark">Create Organization</DialogTitle>
            <DialogDescription>
              Set up a new organization to manage your leagues and events
            </DialogDescription>
          </DialogHeader>
          <CreateOrganizationForm
            onSuccess={handleCreateOrgSuccess}
            onClose={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-dark">Join Organization</DialogTitle>
            <DialogDescription>
              Enter the organization ID to join an existing organization
            </DialogDescription>
          </DialogHeader>
          <JoinOrganizationForm
            onSuccess={handleJoinOrgSuccess}
            onClose={() => setShowJoinModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default function OrganizationHub() {
  return <OrganizationHubContent />;
}
