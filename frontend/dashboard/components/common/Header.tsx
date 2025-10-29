import { SignOutButton } from "@clerk/nextjs";
import { LucideLogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <SignOutButton>
          <Button variant="brandLight">
            <p>Sign out</p>
            <LucideLogOut className="h-4 w-4" />
          </Button>
        </SignOutButton>
      </div>
    </header>
  );
}
