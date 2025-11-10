import { z } from "zod";

// Game occurrence schema for individual game schedule
export const gameOccurrenceSchema = z.object({
  day: z.string()
    .min(1, "Day is required")
    .max(20, "Day name too long"),
  startTime: z.string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z.string()
    .regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
});

export type GameOccurrence = z.infer<typeof gameOccurrenceSchema>;

// Main league form schema
export const addLeagueSchema = z.object({
  sport_id: z.number()
    .optional()
    .nullable(),
  sport_name: z.string()
    .min(1, "Sport name is required")
    .max(255, "Sport name must be at most 255 characters"),
  venue_id: z.number()
    .optional()
    .nullable(),
  venue_name: z.string()
    .max(255, "Venue name must be at most 255 characters")
    .optional()
    .nullable(),
  venue_address: z.string()
    .max(500, "Venue address must be at most 500 characters")
    .optional()
    .nullable(),
  venue_lat: z.number()
    .optional()
    .nullable(),
  venue_lng: z.number()
    .optional()
    .nullable(),
  league_name: z.string()
    .min(1, "League name is required")
    .max(255, "League name must be at most 255 characters"),
  division: z.enum(["beginner", "intermediate", "expert"])
    .refine(val => val, "Please select a skill level"),
  gender: z.enum(["male", "female", "co-ed"])
    .refine(val => val, "Please select a gender"),
  registration_deadline: z.string()
    .min(1, "Registration deadline is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  season_start_date: z.string()
    .min(1, "Season start date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  season_end_date: z.string()
    .optional()
    .nullable(),
  season_details: z.string()
    .max(2000, "Season details must be at most 2000 characters")
    .optional()
    .nullable(),
  game_occurrences: z.array(gameOccurrenceSchema)
    .min(1, "At least one game occurrence is required"),
  pricing_strategy: z.enum(["per_team", "per_person"])
    .refine(val => val, "Please select a pricing strategy"),
  pricing_amount: z.number()
    .min(0.01, "Pricing amount must be greater than 0"),
  per_game_fee: z.number()
    .optional()
    .nullable(),
  registration_url: z.string()
    .url("Registration URL must be a valid URL")
    .max(500, "Registration URL must be at most 500 characters"),
  duration: z.number()
    .min(1, "Duration must be at least 1 week")
    .max(52, "Duration must be at most 52 weeks"),
  minimum_team_players: z.number()
    .min(1, "Minimum team players must be at least 1")
    .max(100, "Minimum team players must be at most 100"),
  org_id: z.number()
    .optional(),
  organization_name: z.string()
    .min(1, "Organization name is required"),
});

export type AddLeagueFormData = z.infer<typeof addLeagueSchema>;

// Template creation schema
export const createTemplateSchema = z.object({
  name: z.string()
    .min(1, "Template name is required")
    .max(255, "Template name must be at most 255 characters"),
  description: z.string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

export type CreateTemplateFormData = z.infer<typeof createTemplateSchema>;
