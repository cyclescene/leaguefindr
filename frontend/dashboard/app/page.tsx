"use client"
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { ClerkUser } from "@/types/clerk";

function DashboardContent() {
  const { user, isLoaded } = useUser() as { user: ClerkUser | null; isLoaded: boolean };
  const role = user?.publicMetadata?.role;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <header className="bg-brand-dark text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-brand-light mt-2">Welcome, {user?.firstName || 'User'}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-brand-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm uppercase tracking-wide">Role</p>
              <p className="text-2xl font-semibold text-brand-dark mt-2">
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}
              </p>
            </div>
            <SignOutButton>
              <button className="bg-brand-dark hover:bg-opacity-90 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
