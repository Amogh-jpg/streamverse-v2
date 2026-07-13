"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { profileUpdateSchema, firstIssueMessage } from "@/lib/validation";

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; error: string };

const UNIQUE_VIOLATION = "23505";

/** Update the current user's profile (display name, bio, avatar, slug, visibility). */
export async function updateProfile(
  input: unknown,
): Promise<ProfileActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts aren't configured yet." };
  }

  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { displayName, bio, avatarUrl, publicSlug, isPublic } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio,
      avatar_url: avatarUrl,
      public_slug: publicSlug,
      is_public: isPublic,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "That profile URL is already taken." };
    }
    return { ok: false, error: "Couldn't save your profile. Try again." };
  }

  revalidatePath("/profile");
  if (publicSlug) revalidatePath(`/profile/${publicSlug}`);
  return { ok: true };
}
