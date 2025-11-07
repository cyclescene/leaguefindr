import { z } from "zod";

export const addOrgSchema = z.object({
  name: z.string()
    .min(1, "Organization name is required")
    .min(2, "Organization name must be at least 2 characters")
    .max(255, "Organization name must be at most 255 characters"),
  url: z.string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  email: z.string()
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
