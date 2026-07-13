"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { detailHref } from "@/lib/links";
import type { MediaType } from "@/types/media-item";
import {
  reviewSchema,
  mediaTypeSchema,
  mediaIdSchema,
  firstIssueMessage,
} from "@/lib/validation";

export type ReviewActionResult =
  | { ok: true }
  | { ok: false; error: string };

/** Create or update the current user's review for a title. */
export async function upsertReview(
  input: unknown,
): Promise<ReviewActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts aren't configured yet." };
  }

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to write a review." };

  const { mediaType, mediaId, rating, body } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: user.id,
      media_type: mediaType,
      media_id: mediaId,
      rating,
      body,
    },
    { onConflict: "user_id,media_type,media_id" },
  );

  if (error) {
    return { ok: false, error: "Couldn't save your review. Try again." };
  }

  revalidatePath(detailHref(mediaType as MediaType, mediaId));
  revalidatePath("/profile");
  return { ok: true };
}

/** Delete the current user's review for a title. */
export async function deleteReview(input: {
  mediaType: unknown;
  mediaId: unknown;
}): Promise<ReviewActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts aren't configured yet." };
  }

  const type = mediaTypeSchema.safeParse(input.mediaType);
  const id = mediaIdSchema.safeParse(input.mediaId);
  if (!type.success || !id.success) {
    return { ok: false, error: "That title is invalid." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("user_id", user.id)
    .eq("media_type", type.data)
    .eq("media_id", id.data);

  if (error) {
    return { ok: false, error: "Couldn't delete your review. Try again." };
  }

  revalidatePath(detailHref(type.data as MediaType, id.data));
  revalidatePath("/profile");
  return { ok: true };
}
