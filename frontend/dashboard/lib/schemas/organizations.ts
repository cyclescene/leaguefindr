import { z } from "zod";

export const addOrgSchema = z.object({
  name: z.string()
    .min(1, "Organization name is required")
    .min(2, "Organization name must be at least 2 characters")
    .max(255, "Organization name must be at most 255 characters"),
});

export type AddOrgFormData = z.infer<typeof addOrgSchema>;
