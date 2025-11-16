import { SignOutButton } from "@clerk/nextjs";
import { LucideLogOut, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";

interface HeaderProps {
  organizationName?: string;
}

export function Header({ organizationName = "User" }: HeaderProps) {
  return (
    <header className="bg-brand-dark text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-row items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-brand-light mt-2">Welcome, {organizationName}</p>
        </div>
        <div className="flex items-center gap-6">
          {/* Notification Center */}
          <NotificationCenter />

          {/* Settings Link */}
          <Link href="/admin/settings" title="Settings">
            <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-brand-dark/80">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>

          {/* Sign Out */}
          <SignOutButton>
            <Button variant="brandLight">
              <p>Sign out</p>
              <LucideLogOut className="h-4 w-4" />
            </Button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}
