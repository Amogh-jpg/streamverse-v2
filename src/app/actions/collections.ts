"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  collectionSchema,
  collectionItemSchema,
  firstIssueMessage,
} from "@/lib/validation";
import { z } from "zod";

export type CollectionActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateCollectionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

async function requireUser() {
  const user = await getCurrentUser();
  return user;
}

/** Create a new collection owned by the current user. */
export async function createCollection(
  input: unknown,
): Promise<CreateCollectionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts aren't configured yet." };
  }

  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  const user = await requireUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      is_public: parsed.data.isPublic,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Couldn't create the collection. Try again." };
  }

  revalidatePath("/collections");
  return { ok: true, id: data.id as string };
}

const updateSchema = collectionSchema.extend({
  id: z.string().uuid("Invalid collection."),
});

/** Rename / re-describe / change the visibility of a collection. */
export async function updateCollection(
  input: unknown,
): Promise<CollectionActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts aren't configured yet." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  const user = await requireUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("collections")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      is_public: parsed.data.isPublic,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: "Couldn't update the collection. Try again." };
  }

  revalidatePath("/collections");
  revalidatePath(`/collections/${parsed.data.id}`);
  return { ok: true };
}

/** Delete a collection (and, via cascade, its items). */
export async function deleteCollection(
  id: unknown,
): Promise<CollectionActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts aren't configured yet." };
  }

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "That collection is invalid." };

  const user = await requireUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: "Couldn't delete the collection. Try again." };
  }

  revalidatePath("/collections");
  return { ok: true };
}

/** Add a title to a collection (idempotent — duplicates are ignored). */
export async function addToCollection(
  input: unknown,
): Promise<CollectionActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts aren't configured yet." };
  }

  const parsed = collectionItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  const user = await requireUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const supabase = await createSupabaseServerClient();

  // Ownership is enforced by RLS, but check first for a clean error message.
  const { data: owned } = await supabase
    .from("collections")
    .select("id")
    .eq("id", parsed.data.collectionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return { ok: false, error: "That collection isn't yours." };

  const { error } = await supabase.from("collection_items").upsert(
    {
      collection_id: parsed.data.collectionId,
      media_type: parsed.data.mediaType,
      media_id: parsed.data.mediaId,
    },
    { onConflict: "collection_id,media_type,media_id", ignoreDuplicates: true },
  );

  if (error) {
    return { ok: false, error: "Couldn't add to the collection. Try again." };
  }

  revalidatePath("/collections");
  revalidatePath(`/collections/${parsed.data.collectionId}`);
  return { ok: true };
}

/** Remove a title from a collection. */
export async function removeFromCollection(
  input: unknown,
): Promise<CollectionActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts aren't configured yet." };
  }

  const parsed = collectionItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  const user = await requireUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const supabase = await createSupabaseServerClient();
  const { data: owned } = await supabase
    .from("collections")
    .select("id")
    .eq("id", parsed.data.collectionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return { ok: false, error: "That collection isn't yours." };

  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", parsed.data.collectionId)
    .eq("media_type", parsed.data.mediaType)
    .eq("media_id", parsed.data.mediaId);

  if (error) {
    return { ok: false, error: "Couldn't remove from the collection. Try again." };
  }

  revalidatePath("/collections");
  revalidatePath(`/collections/${parsed.data.collectionId}`);
  return { ok: true };
}
