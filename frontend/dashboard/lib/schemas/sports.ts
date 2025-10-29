import { z } from "zod";

export const addSportSchema = z.object({
  name: z.string()
    .min(1, "Sport name is required")
    .min(2, "Sport name must be at least 2 characters")
    .max(255, "Sport name must be at most 255 characters"),
});

export type AddSportFormData = z.infer<typeof addSportSchema>;
