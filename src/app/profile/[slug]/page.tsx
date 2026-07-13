import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CopyLinkButton } from "@/components/common/copy-link-button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { UserReviews } from "@/components/reviews/user-reviews";
import { CollectionCard } from "@/components/collections/collection-card";
import { publicEnv } from "@/lib/env";
import { getPublicProfileBySlug } from "@/lib/profiles";
import { getReviewsByUser } from "@/lib/reviews";
import { getPublicCollectionsByUser } from "@/lib/collections";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);
  if (!profile) return { title: "Profile" };
  const name = profile.displayName ?? "StreamVerse member";
  return {
    title: name,
    description: profile.bio ?? `${name}'s public profile on StreamVerse.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);
  if (!profile) notFound();

  const [collections, reviews] = await Promise.all([
    getPublicCollectionsByUser(profile.id),
    getReviewsByUser(profile.id),
  ]);

  const publicUrl = `${publicEnv.siteUrl}/profile/${slug}`;

  return (
    <PageContainer className="space-y-8">
      <ProfileHeader
        displayName={profile.displayName}
        avatarUrl={profile.avatarUrl}
        bio={profile.bio}
        creatorVerified={profile.creatorVerified}
      >
        <CopyLinkButton url={publicUrl} label="Share profile" />
      </ProfileHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold sm:text-xl">Public collections</h2>
        {collections.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No public collections yet.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold sm:text-xl">Reviews</h2>
        {reviews.length > 0 ? (
          <UserReviews reviews={reviews} />
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            <Star className="size-4" />
            No reviews yet.
          </div>
        )}
      </section>
    </PageContainer>
  );
}
