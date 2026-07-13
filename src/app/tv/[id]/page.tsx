import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MediaDetailView } from "@/components/media/media-detail-view";
import { TvSeasons } from "@/components/media/tv-seasons";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { AddToCollection } from "@/components/collections/add-to-collection";
import { getTvDetail } from "@/lib/adapters/tmdb";
import { isTmdbConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { isInWatchlist } from "@/lib/watchlist";
import { getOwnCollectionsForItem } from "@/lib/collections";

async function loadTv(id: string) {
  if (!isTmdbConfigured()) return null;
  try {
    return await getTvDetail(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const show = await loadTv(id);
  if (!show) return { title: "TV Show" };
  return {
    title: show.title,
    description: show.synopsis?.slice(0, 160),
  };
}

export default async function TvDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const show = await loadTv(id);
  if (!show) notFound();

  const [user, inWatchlist, collections] = await Promise.all([
    getCurrentUser(),
    isInWatchlist("tv", id),
    getOwnCollectionsForItem("tv", id),
  ]);
  const isAuthenticated = Boolean(user);

  return (
    <MediaDetailView
      detail={show}
      isAuthenticated={isAuthenticated}
      inWatchlist={inWatchlist}
      extraActions={
        <AddToCollection
          mediaType="tv"
          mediaId={id}
          isAuthenticated={isAuthenticated}
          collections={collections.map((c) => ({
            id: c.id,
            name: c.name,
            itemCount: c.itemCount,
            containsItem: c.containsItem,
          }))}
        />
      }
    >
      {show.seasons && show.seasons.length > 0 ? (
        <TvSeasons tvId={id} seasons={show.seasons} />
      ) : null}
      <ReviewsSection mediaType="tv" mediaId={id} />
    </MediaDetailView>
  );
}
