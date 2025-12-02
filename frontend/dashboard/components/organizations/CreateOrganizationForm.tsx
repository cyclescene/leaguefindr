"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
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

interface Organization {
  id: string;
  org_name: string;
  org_email?: string;
  org_phone?: string;
  org_url?: string;
  org_address?: string;
}

interface CreateOrganizationFormProps {
  onSuccess: (orgId: string, orgName: string) => void;
  onClose: () => void;
  organization?: Organization;
}

export function CreateOrganizationForm({ onSuccess, onClose, organization }: CreateOrganizationFormProps) {
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!organization;

  const form = useForm<AddOrgFormData>({
    resolver: zodResolver(addOrgSchema),
    defaultValues: {
      name: organization?.org_name || "",
      url: organization?.org_url || "",
      email: organization?.org_email || "",
      phone: organization?.org_phone || "",
      address: organization?.org_address || "",
    },
  });

  const onSubmit = async (data: AddOrgFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const endpoint = isEditMode
        ? `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/${organization!.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          org_name: data.name,
          org_url: data.url,
          org_email: data.email || null,
          org_phone: data.phone || null,
          org_address: data.address || null,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to ${isEditMode ? "update" : "create"} organization`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response body is not JSON, use the response text or default message
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      const orgId = isEditMode ? organization!.id : result.id;
      const orgName = isEditMode ? data.name : result.org_name;
      onSuccess(orgId, orgName);
      onClose();
    } catch (err) {
      let message = err instanceof Error ? err.message : "An error occurred";

      // Add contact email for duplicate organization errors
      if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("already exists")) {
        message = `${message}. Please contact info@leaguefindr.com if you believe this is an error.`;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pr-2">
      {error && (
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
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
                <FormLabel className="text-brand-dark">Website URL *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="example.com or https://www.example.com"
                    type="text"
                    className="border-brand-light focus:ring-red-500 focus:border-red-500"
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
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Update Organization" : "Create Organization"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
