"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
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
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

interface JoinOrganizationFormProps {
  onSuccess: (orgId: string, orgName: string) => void;
  onClose: () => void;
}

export function JoinOrganizationForm({ onSuccess, onClose }: JoinOrganizationFormProps) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      orgId: "",
    },
  });

  const onSubmit = async (data: { orgId: string }) => {
    if (!data.orgId.trim()) {
      setError("Organization ID is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const token = await user.getIdToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            org_id: data.orgId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to join organization");
      }

      const result = await response.json();
      onSuccess(result.org_id, result.org_name);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="orgId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-dark">Organization ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Paste the organization ID"
                    type="text"
                    className="border-brand-light focus:ring-brand-dark focus:border-brand-dark"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <p className="text-xs text-neutral-600 mt-1">
                  Ask your organization admin for the organization ID
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-brand-dark text-brand-dark hover:bg-brand-light"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-dark hover:bg-brand-dark/90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Organization"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
