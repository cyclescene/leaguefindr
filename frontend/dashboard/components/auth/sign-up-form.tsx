"use client";

import { useSignUp, useAuth, useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { signUpSchema, type SignUpFormData } from "@/lib/schemas";
import { Loader2 } from "lucide-react";

export function SignUpForm() {
  const { signUp, isLoaded: signUpIsLoaded, setActive } = useSignUp();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });


  const onSubmit = async (data: SignUpFormData) => {
    try {
      if (!signUpIsLoaded || !signUp) return;

      setSubmitted(true);

      // Create account with Clerk
      const result = await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      // Prepare email verification with code strategy
      if (result.status === "missing_requirements") {
        try {
          await signUp.prepareEmailAddressVerification({
            strategy: "email_code",
          });
          // Show loading state and redirect to email verification
          setIsRedirecting(true);
          router.push('/verify-email');
        } catch (err) {
          console.error('Failed to prepare email verification:', err);
          setSubmitted(false);
          return;
        }
      } else if (result.status === "complete") {
        // Sign-up is complete and session is created
        setIsRedirecting(true);

        // Set the session as active
        try {
          await setActive({ session: result.createdSessionId });
          console.log('✓ Session set as active');
        } catch (error) {
          console.error('✗ Failed to set session as active:', error);
          setSubmitted(false);
          return;
        }

        // Redirect to verify email - all users need email verification
        router.push('/verify-email');
      } else {
        setSubmitted(false);
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      setSubmitted(false);
    }
  };


  return (
    <>
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-dark" size={40} />
            <p className="text-brand-dark font-medium">Setting up your account...</p>
          </div>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {submitted && !isRedirecting && (
            <div className="rounded-md bg-brand-light p-3 text-sm text-brand-dark font-medium">
              Success! Check your email to verify your account...
            </div>
          )}

          <div id="clerk-captcha" />

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

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-dark">Confirm Password</FormLabel>
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
            {form.formState.isSubmitting ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </Form>
    </>
  );
}
