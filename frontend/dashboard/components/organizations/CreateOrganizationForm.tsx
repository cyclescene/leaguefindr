"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { addOrgSchema, type AddOrgFormData } from "@/lib/schemas/organizations";
import { Loader2 } from "lucide-react";

interface CreateOrganizationFormProps {
  onSuccess: (orgId: string, orgName: string) => void;
  onClose: () => void;
}

export function CreateOrganizationForm({ onSuccess, onClose }: CreateOrganizationFormProps) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AddOrgFormData>({
    resolver: zodResolver(addOrgSchema),
    defaultValues: {
      name: "",
      url: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: AddOrgFormData) => {
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
        `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            org_name: data.name,
            org_url: data.url || null,
            org_email: data.email || null,
            org_phone: data.phone || null,
            org_address: data.address || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create organization");
      }

      const result = await response.json();
      onSuccess(result.id, result.org_name);
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-dark">Organization Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your Organization"
                    type="text"
                    className="border-brand-light focus:ring-brand-dark focus:border-brand-dark"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-dark">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="contact@organization.com"
                    type="email"
                    className="border-brand-light focus:ring-brand-dark focus:border-brand-dark"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-dark">Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(555) 123-4567"
                    type="tel"
                    className="border-brand-light focus:ring-brand-dark focus:border-brand-dark"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-dark">Website</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://www.organization.com"
                    type="url"
                    className="border-brand-light focus:ring-brand-dark focus:border-brand-dark"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-brand-dark">Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123 Main Street, City, State 12345"
                    type="text"
                    className="border-brand-light focus:ring-brand-dark focus:border-brand-dark"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
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
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
