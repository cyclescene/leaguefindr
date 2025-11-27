"use client";

import { useSignIn, useAuth, useSession } from "@clerk/nextjs";
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
  const { signIn, isLoaded, setActive
  } = useSignIn();
  const { userId, isLoaded: isUserLoaded, getToken, } = useAuth();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "admin@leaguefindr.com",
      password: "pB7-aKZ$kjFgvN8",
    },
  });

  // Redirect to home if user is already authenticated
  // The middleware will handle routing based on the user's role
  useEffect(() => {
    if (isUserLoaded && userId) {
      router.push('/');
    }
  }, [isUserLoaded, userId, router]);

  const onSubmit = async (data: SignInFormData) => {
    try {
      if (!isLoaded || !signIn) return;

      setSubmitted(true);

      // Sign in with Clerk
      const result = await signIn.create({
        identifier: data.email,
        strategy: "password",
        password: data.password,
      });



      if (result.status === "complete") {
        console.log('=== Sign-in Complete ===');
        console.log('New Session ID created:', result.createdSessionId);

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

        console.log('Backend login response status:', response.status);

        if (!response.ok) {
          console.error('Backend login failed');
          setSubmitted(false);
          return;
        }

        // Show loading state
        setIsRedirecting(true);

        // Set the session as active to load session claims (including appRole)
        console.log('Setting session as active:', result.createdSessionId);
        try {
          await setActive({ session: result.createdSessionId });
          console.log('✓ Session set as active:', result.createdSessionId);

          // Give the session a moment to be fully ready
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error('✗ Failed to set session as active:', error);
          setSubmitted(false);
          return;
        }

        // Redirect - Supabase context will initialize with the new session
        console.log('Redirecting to home...');
        router.push('/');
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
