import "server-only";

import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  publicSlug: string | null;
  isPublic: boolean;
  creatorVerified: boolean;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  public_slug: string | null;
  is_public: boolean;
  creator_verified: boolean;
  created_at: string;
}

const PROFILE_COLUMNS =
  "id, display_name, avatar_url, bio, public_slug, is_public, creator_verified, created_at";

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    publicSlug: row.public_slug,
    isPublic: row.is_public,
    creatorVerified: row.creator_verified,
    createdAt: row.created_at,
  };
}

/** The current user's profile row, or null when signed out / unconfigured. */
export async function getOwnProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return data ? mapProfile(data) : null;
}

/** A public profile addressed by its slug. Only returns opted-in public rows. */
export async function getPublicProfileBySlug(
  slug: string,
): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("public_slug", slug)
    .eq("is_public", true)
    .maybeSingle<ProfileRow>();

  return data ? mapProfile(data) : null;
}
