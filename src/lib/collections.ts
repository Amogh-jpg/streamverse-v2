import "server-only";

import type { MediaItem } from "@/types/media-item";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getMediaDetail } from "@/lib/adapters/registry";

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  itemCount: number;
}

export interface CollectionItemRow {
  mediaType: string;
  mediaId: string;
}

export interface CollectionDetail extends Collection {
  isOwner: boolean;
  items: MediaItem[];
  ownerName: string | null;
}

interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  collection_items?: { count: number }[];
}

function mapCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    createdAt: row.created_at,
    itemCount: row.collection_items?.[0]?.count ?? 0,
  };
}

const COLLECTION_COLUMNS =
  "id, user_id, name, description, is_public, created_at, collection_items(count)";

/** The current user's collections, newest first, with item counts. */
export async function getOwnCollections(): Promise<Collection[]> {
  if (!isSupabaseConfigured()) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("collections")
    .select(COLLECTION_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return ((data as CollectionRow[] | null) ?? []).map(mapCollection);
}

/** Public collections belonging to a given user (for public profiles). */
export async function getPublicCollectionsByUser(
  userId: string,
): Promise<Collection[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("collections")
    .select(COLLECTION_COLUMNS)
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return ((data as CollectionRow[] | null) ?? []).map(mapCollection);
}

/**
 * A single collection with its items hydrated through the adapter layer. RLS
 * guarantees the row is only returned when it's public or owned by the caller.
 */
export async function getCollectionById(
  id: string,
): Promise<CollectionDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  const { data: row } = await supabase
    .from("collections")
    .select(
      "id, user_id, name, description, is_public, created_at, profiles ( display_name )",
    )
    .eq("id", id)
    .maybeSingle<
      CollectionRow & { profiles?: { display_name: string | null } | null }
    >();

  if (!row) return null;

  const { data: itemRows } = await supabase
    .from("collection_items")
    .select("media_type, media_id, id")
    .eq("collection_id", id)
    .order("id", { ascending: true });

  const items = await Promise.all(
    ((itemRows as { media_type: string; media_id: string }[] | null) ?? []).map(
      async (item) => {
        try {
          return (await getMediaDetail(
            item.media_type,
            item.media_id,
          )) as MediaItem | null;
        } catch {
          return null;
        }
      },
    ),
  );

  return {
    ...mapCollection(row),
    isOwner: Boolean(user && user.id === row.user_id),
    ownerName: row.profiles?.display_name ?? null,
    items: items.filter((i): i is MediaItem => i !== null),
  };
}

export interface CollectionMembership extends Collection {
  containsItem: boolean;
}

/**
 * The current user's collections annotated with whether each already contains
 * the given title — powers the "add to collection" picker.
 */
export async function getOwnCollectionsForItem(
  mediaType: string,
  mediaId: string,
): Promise<CollectionMembership[]> {
  if (!isSupabaseConfigured()) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createSupabaseServerClient();
  const [{ data: collections }, { data: memberships }] = await Promise.all([
    supabase
      .from("collections")
      .select(COLLECTION_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("collection_items")
      .select("collection_id")
      .eq("media_type", mediaType)
      .eq("media_id", mediaId),
  ]);

  const containing = new Set(
    ((memberships as { collection_id: string }[] | null) ?? []).map(
      (m) => m.collection_id,
    ),
  );

  return ((collections as CollectionRow[] | null) ?? []).map((row) => ({
    ...mapCollection(row),
    containsItem: containing.has(row.id),
  }));
}
