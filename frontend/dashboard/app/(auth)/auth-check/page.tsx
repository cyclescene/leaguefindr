"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCheckPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // User is authenticated, wait a bit then do a hard refresh to dashboard
        // This gives the server-side Clerk session time to establish
        setRedirecting(true);
        setTimeout(() => {
          console.log('Auth verified, doing hard refresh to dashboard');
          window.location.href = '/';
        }, 2000);
      } else {
        // User is not authenticated, go back to signin
        console.log('No user found, redirecting to signin');
        router.push('/signin');
      }
    }
  }, [isLoaded, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-brand-dark" size={40} />
        <p className="text-brand-dark font-medium">
          {redirecting ? 'Establishing your session...' : 'Verifying your account...'}
        </p>
      </div>
    </div>
  );
}
