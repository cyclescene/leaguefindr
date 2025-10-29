import { z } from "zod";

export const addVenueSchema = z.object({
  name: z.string()
    .min(1, "Venue name is required")
    .min(2, "Venue name must be at least 2 characters")
    .max(255, "Venue name must be at most 255 characters"),
  address: z.string()
    .min(1, "Address is required")
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must be at most 500 characters"),
});

export type AddVenueFormData = z.infer<typeof addVenueSchema>;
