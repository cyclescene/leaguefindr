"use client"

import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { ClerkUser } from "@/types/clerk";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useOrganization } from "@/hooks/useOrganizations";

function OrganizationDashboardContent() {
  const { user, isLoaded } = useUser() as { user: ClerkUser | null; isLoaded: boolean };
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const { organization, isLoading, error } = useOrganization(orgId);

  // Redirect to home if user doesn't have access (403 error)
  useEffect(() => {
    if (error && error.message.includes("403")) {
      router.push("/");
    }
  }, [error, router]);

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
            <button className="text-brand-dark hover:text-brand-dark/80 font-semibold">
              Coming Soon →
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 border border-neutral-200">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">Venues</h2>
            <p className="text-neutral-600 mb-4">Add and manage venues for your organization</p>
            <button className="text-brand-dark hover:text-brand-dark/80 font-semibold">
              Coming Soon →
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 border border-neutral-200">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">Sports</h2>
            <p className="text-neutral-600 mb-4">Create and manage sports for your leagues</p>
            <button className="text-brand-dark hover:text-brand-dark/80 font-semibold">
              Coming Soon →
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 border border-neutral-200">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">Settings</h2>
            <p className="text-neutral-600 mb-4">Manage organization settings and members</p>
            <button className="text-brand-dark hover:text-brand-dark/80 font-semibold">
              Coming Soon →
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OrganizationDashboard() {
  return <OrganizationDashboardContent />;
}
