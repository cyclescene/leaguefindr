"use client"

import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import type { ClerkUser } from "@/types/clerk";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";

function UserDashboardContent() {
  const { user, isLoaded } = useUser() as { user: ClerkUser | null; isLoaded: boolean };
  const { organizationName } = user?.publicMetadata || {};

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header organizationName={organizationName} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-dark mb-4">Welcome to LeagueFindr</h1>
          <p className="text-neutral-600 mb-8">User dashboard coming soon...</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function UserDashboard() {
  return <UserDashboardContent />;
}
