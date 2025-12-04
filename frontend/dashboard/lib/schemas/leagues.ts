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
  division: z.string()
    .min(1, "Skill level is required")
    .max(255, "Skill level must be at most 255 characters"),
  gender: z.enum(["male", "female", "co-ed"])
    .refine(val => val, "Please select a gender"),
  registration_deadline: z.string()
    .min(1, "Registration deadline is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  season_start_date: z.string()
    .min(1, "Season start date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  season_end_date: z.any()
    .transform((val) => {
      // Convert empty strings or undefined to a dummy date that won't cause parsing errors
      if (!val || val === '') return '1900-01-01'
      return String(val)
    }),
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
  per_game_fee: z.union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || val === '') return null;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
  registration_url: z.string()
    .min(1, "Registration URL is required")
    .max(500, "Registration URL must be at most 500 characters")
    .refine(
      (url) => {
        try {
          // If no protocol, add https:// for validation
          const urlToValidate = url.includes("://") ? url : `https://${url}`
          new URL(urlToValidate)
          return true
        } catch {
          return false
        }
      },
      "Registration URL must be a valid website (e.g., example.com or https://example.com)"
    ),
  duration: z.number()
    .min(1, "Duration must be at least 1 week")
    .max(52, "Duration must be at most 52 weeks"),
  minimum_team_players: z.number()
    .min(1, "Minimum team players must be at least 1")
    .max(100, "Minimum team players must be at most 100"),
  org_id: z.string()
    .optional(),
  organization_name: z.string()
    .optional(),
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
