import "server-only";

import type { MediaItem } from "@/types/media-item";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getMediaDetail } from "@/lib/adapters/registry";

export interface Review {
  id: string;
  userId: string;
  mediaType: string;
  mediaId: string;
  rating: number | null;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    displayName: string | null;
    avatarUrl: string | null;
    publicSlug: string | null;
  } | null;
}

interface ReviewRow {
  id: string;
  user_id: string;
  media_type: string;
  media_id: string;
  rating: number | null;
  body: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    public_slug: string | null;
    is_public: boolean;
  } | null;
}

const REVIEW_COLUMNS =
  "id, user_id, media_type, media_id, rating, body, created_at, updated_at, profiles ( display_name, avatar_url, public_slug, is_public )";

function mapReview(row: ReviewRow): Review {
  const p = row.profiles ?? null;
  return {
    id: row.id,
    userId: row.user_id,
    mediaType: row.media_type,
    mediaId: row.media_id,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: p
      ? {
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
          // Only surface a link to profiles that opted into being public.
          publicSlug: p.is_public ? p.public_slug : null,
        }
      : null,
  };
}

/** All reviews for a title, newest first. Reviews are publicly readable. */
export async function getReviewsForMedia(
  mediaType: string,
  mediaId: string,
): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("media_type", mediaType)
    .eq("media_id", mediaId)
    .order("created_at", { ascending: false });

  return ((data as ReviewRow[] | null) ?? []).map(mapReview);
}

/** The signed-in user's own review for a title, if any. */
export async function getOwnReviewForMedia(
  mediaType: string,
  mediaId: string,
): Promise<Review | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("user_id", user.id)
    .eq("media_type", mediaType)
    .eq("media_id", mediaId)
    .maybeSingle<ReviewRow>();

  return data ? mapReview(data) : null;
}

export interface ReviewWithMedia extends Review {
  media: MediaItem | null;
}

/** A user's reviews across all titles, hydrated with media metadata. */
export async function getReviewsByUser(
  userId: string,
): Promise<ReviewWithMedia[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const reviews = ((data as ReviewRow[] | null) ?? []).map(mapReview);

  return Promise.all(
    reviews.map(async (review) => {
      let media: MediaItem | null = null;
      try {
        media = await getMediaDetail(review.mediaType, review.mediaId);
      } catch {
        media = null;
      }
      return { ...review, media };
    }),
  );
}

export interface MediaRatingSummary {
  average: number | null;
  count: number;
}

/** Aggregate community rating for a title from StreamVerse reviews. */
export async function getMediaRatingSummary(
  mediaType: string,
  mediaId: string,
): Promise<MediaRatingSummary> {
  if (!isSupabaseConfigured()) return { average: null, count: 0 };

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("media_type", mediaType)
    .eq("media_id", mediaId)
    .not("rating", "is", null);

  const ratings = ((data as { rating: number | null }[] | null) ?? [])
    .map((r) => r.rating)
    .filter((r): r is number => typeof r === "number");

  if (ratings.length === 0) return { average: null, count: 0 };
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return { average, count: ratings.length };
}
