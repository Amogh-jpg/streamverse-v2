/**
 * Shared input validation for Phase 2 user-generated content (profiles,
 * reviews, collections). Server actions parse untrusted input through these
 * Zod schemas so the database only ever sees well-formed data, independent of
 * client-side checks.
 */

import { z } from "zod";

/** Media types users can attach reviews / collection entries to today. */
export const REVIEWABLE_MEDIA_TYPES = ["movie", "tv", "anime"] as const;
export type ReviewableMediaType = (typeof REVIEWABLE_MEDIA_TYPES)[number];

export const mediaTypeSchema = z.enum(REVIEWABLE_MEDIA_TYPES);

export const mediaIdSchema = z
  .string()
  .trim()
  .min(1, "A media id is required.")
  .max(64, "That media id is too long.");

// --- Profiles --------------------------------------------------------------

export const PUBLIC_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name can't be empty.")
    .max(60, "Display name must be 60 characters or fewer."),
  bio: z
    .string()
    .trim()
    .max(280, "Bio must be 280 characters or fewer.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  avatarUrl: z
    .union([z.string().trim().url("Enter a valid image URL."), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  publicSlug: z
    .union([
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(
          PUBLIC_SLUG_PATTERN,
          "Use 3-40 characters: lowercase letters, numbers and hyphens.",
        ),
      z.literal(""),
    ])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  isPublic: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// --- Reviews ---------------------------------------------------------------

export const reviewSchema = z.object({
  mediaType: mediaTypeSchema,
  mediaId: mediaIdSchema,
  rating: z
    .number({ error: "Pick a rating." })
    .int("Rating must be a whole number.")
    .min(1, "Rating must be between 1 and 10.")
    .max(10, "Rating must be between 1 and 10."),
  body: z
    .string()
    .trim()
    .max(4000, "Reviews must be 4000 characters or fewer.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// --- Collections -----------------------------------------------------------

export const collectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give your collection a name.")
    .max(80, "Name must be 80 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(280, "Description must be 280 characters or fewer.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  isPublic: z.boolean().default(false),
});

export type CollectionInput = z.infer<typeof collectionSchema>;

export const collectionItemSchema = z.object({
  collectionId: z.string().uuid("Invalid collection."),
  mediaType: mediaTypeSchema,
  mediaId: mediaIdSchema,
});

export type CollectionItemInput = z.infer<typeof collectionItemSchema>;

/** Flatten a ZodError into the first human-readable message. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "That input is invalid.";
}
