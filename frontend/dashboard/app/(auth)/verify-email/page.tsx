"use client";

import { useState } from "react";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { signUp, isLoaded: signUpIsLoaded } = useSignUp();
  const { userId } = useAuth();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleVerifyCode = async () => {
    if (!signUpIsLoaded || !signUp || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setVerifying(true);
      setError("");

      // Attempt to verify the email with the code
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.verifications?.emailAddress?.status === "verified") {
        // Email verified! Now sync user to backend
        try {
          const clerkId = signUp.createdUserId || userId;
          const email = signUp.emailAddress || "";

          if (!clerkId) {
            setError("Failed to get user ID. Please try again.");
            setVerifying(false);
            return;
          }

          const syncResponse = await fetch("/api/auth?action=register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clerkID: clerkId,
              email: email,
            }),
          });

          if (!syncResponse.ok) {
            const errorText = await syncResponse.text();
            console.error("Failed to sync user to backend:", errorText);
            setError("Failed to complete registration. Please try again.");
            setVerifying(false);
            return;
          }

          // Successfully synced! Redirect to dashboard
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } catch (syncError) {
          console.error("Error syncing user:", syncError);
          setError("Failed to complete registration. Please try again.");
          setVerifying(false);
        }
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to verify code. Please try again."
      );
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!signUpIsLoaded || !signUp) return;

    try {
      setResending(true);
      setResendSuccess(false);
      setError("");

      if (signUp.emailAddress) {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setResendSuccess(true);
        // Reset success message after 5 seconds
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      setError("Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We've sent you a verification code. Check your email to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Check your email inbox for a 6-digit verification code. Enter it below to complete your registration.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <p className="text-sm text-green-800 dark:text-green-200">
                Verification email resent! Check your inbox.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter your 6-digit code:
              </p>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={setCode}
                  disabled={verifying}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={verifying || code.length !== 6}
              className="w-full bg-brand-dark hover:bg-brand-dark/90"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
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

            <Button
              onClick={handleResendEmail}
              disabled={resending || verifying}
              variant="outline"
              className="w-full"
            >
              {resending ? "Sending..." : "Resend Verification Code"}
            </Button>
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
