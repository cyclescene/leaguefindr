"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInSchema, type SignInFormData } from "@/lib/schemas";

export function SignInForm() {
  const { signIn, isLoaded } = useSignIn();
  const { userId, isLoaded: isUserLoaded, sessionClaims } = useAuth();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (isUserLoaded && userId && isRedirecting) {
      const userRole = (sessionClaims?.appRole as string) || "organizer";
      const dashboardUrl = userRole === "admin" ? "/admin" : "/";
      router.push(dashboardUrl);
    }
  }, [isUserLoaded, userId, isRedirecting, sessionClaims, router]);

  const onSubmit = async (data: SignInFormData) => {
    try {
      if (!isLoaded || !signIn) return;

      setSubmitted(true);

      // Sign in with Clerk
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === "complete") {
        // Record login to backend
        const response = await fetch('/api/auth?action=login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: result.createdSessionId,
          }),
        });

        if (!response.ok) {
          setSubmitted(false);
          return;
        }

        // Show loading state and wait for Clerk session to be established
        // The useEffect above will handle the redirect once Clerk updates
        setIsRedirecting(true);
      } else {
        setSubmitted(false);
      }
    } catch (error) {
      setSubmitted(false);
    }
  };


  return (
    <>
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-dark" size={40} />
            <p className="text-brand-dark font-medium">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {submitted && !isRedirecting && (
            <div className="rounded-md bg-brand-light p-3 text-sm text-brand-dark font-medium">
              Success! Redirecting you to the dashboard...
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-dark">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your@email.com"
                    type="email"
                    className="border-brand-light focus:ring-brand-dark focus:border-brand-dark"
                    {...field}
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-dark">Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    className="border-brand-light focus:ring-brand-dark focus:border-brand-dark"
                    {...field}
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>
    </>
  );
}
