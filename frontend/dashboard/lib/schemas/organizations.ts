import { z } from "zod";

export const addOrgSchema = z.object({
  name: z.string()
    .min(1, "Organization name is required")
    .min(2, "Organization name must be at least 2 characters")
    .max(255, "Organization name must be at most 255 characters"),
  url: z
    .string()
    .min(1, "Website URL is required")
    .refine(
      (url) => {
        try {
          // Allow URLs with or without protocol
          const urlToValidate = url.includes("://") ? url : `https://${url}`;
          new URL(urlToValidate);
          return true;
        } catch {
          return false;
        }
      },
      "Please enter a valid URL (e.g., example.com or https://example.com)"
    ),
  email: z
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .optional()
    .or(z.literal("")),
  address: z.string()
    .optional()
    .or(z.literal("")),
});

export type AddOrgFormData = z.infer<typeof addOrgSchema>;
