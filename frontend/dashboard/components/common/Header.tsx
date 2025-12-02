"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { LucideLogOut, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";

interface HeaderProps {
  organizationName?: string;
  email?: string;
}

export function Header({ organizationName, email }: HeaderProps) {
  const { user } = useUser();

  // Get user role from Clerk public metadata
  const userRole = (user?.publicMetadata?.role as string) || "organizer";

  // Determine settings URL based on user role
  const settingsUrl = userRole === "admin" ? "/admin/settings" : "/settings";

  // Get email from prop or from Clerk user
  const displayEmail = email || user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || "User";

  return (
    <header className="bg-brand-dark text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-row items-center justify-between">
        <div className="flex items-center gap-6">
          <Image src="/logo.svg" className="w-auto h-auto" alt="LeagueFindr" loading="eager" width={200} height={200} />
          <p className="text-brand-light text-lg">Welcome, {displayEmail}</p>
        </div>
        <div className="flex items-center gap-6">
          {/* Notification Center */}
          <NotificationCenter />

          {/* Settings Link */}
          <Link href={settingsUrl} title="Settings">
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
