"use client";

import { useEffect, useState } from "react";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { signUp, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // If user is already signed in, redirect to dashboard
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  const handleResendEmail = async () => {
    if (!isLoaded || !signUp) return;

    try {
      setResending(true);
      setResendSuccess(false);

      if (signUp.emailAddress) {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_link",
          redirectUrl: window.location.href,
        });
        setResendSuccess(true);
        // Reset success message after 5 seconds
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Failed to resend verification email:", error);
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We've sent you a verification link. Check your email to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Check your email inbox for a verification link. Click the link to verify your email address and complete your registration.
            </p>
          </div>

          {resendSuccess && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <p className="text-sm text-green-800 dark:text-green-200">
                Verification email resent! Check your inbox.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending ? "Sending..." : "Resend Verification Email"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 dark:bg-slate-950 dark:text-gray-400">
                  or
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already verified your email?{" "}
              <Link href="/" className="text-primary hover:underline">
                Go to dashboard
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Need help?{" "}
            <Link href="/" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
