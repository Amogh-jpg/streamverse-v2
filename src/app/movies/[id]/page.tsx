import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MediaDetailView } from "@/components/media/media-detail-view";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { AddToCollection } from "@/components/collections/add-to-collection";
import { getMovieDetail } from "@/lib/adapters/tmdb";
import { isTmdbConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { isInWatchlist } from "@/lib/watchlist";
import { getOwnCollectionsForItem } from "@/lib/collections";

async function loadMovie(id: string) {
  if (!isTmdbConfigured()) return null;
  try {
    return await getMovieDetail(id);
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
  const movie = await loadMovie(id);
  if (!movie) return { title: "Movie" };
  return {
    title: movie.title,
    description: movie.synopsis?.slice(0, 160),
  };
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await loadMovie(id);
  if (!movie) notFound();

  const [user, inWatchlist, collections] = await Promise.all([
    getCurrentUser(),
    isInWatchlist("movie", id),
    getOwnCollectionsForItem("movie", id),
  ]);
  const isAuthenticated = Boolean(user);

  return (
    <MediaDetailView
      detail={movie}
      isAuthenticated={isAuthenticated}
      inWatchlist={inWatchlist}
      extraActions={
        <AddToCollection
          mediaType="movie"
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
      <ReviewsSection mediaType="movie" mediaId={id} />
    </MediaDetailView>
  );
}
