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
  lat: z.number()
    .min(-90, "Invalid latitude")
    .max(90, "Invalid latitude"),
  lng: z.number()
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude"),
});

export type AddVenueFormData = z.infer<typeof addVenueSchema>;
