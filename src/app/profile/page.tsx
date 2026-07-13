import Link from "next/link";
import { Bookmark, ExternalLink, ListVideo, LogIn, Star } from "lucide-react";
import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { ConfigNotice } from "@/components/common/config-notice";
import { EmptyState } from "@/components/common/empty-state";
import { CopyLinkButton } from "@/components/common/copy-link-button";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { UserReviews } from "@/components/reviews/user-reviews";
import { CollectionCard } from "@/components/collections/collection-card";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { getOwnProfile } from "@/lib/profiles";
import { getReviewsByUser } from "@/lib/reviews";
import { getOwnCollections } from "@/lib/collections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My World",
  description: "Your profile, collections and reviews.",
};

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageContainer className="space-y-6">
        <h1 className="text-2xl font-bold sm:text-3xl">My World</h1>
        <ConfigNotice
          service="Supabase"
          detail="Add Supabase credentials to enable profiles, reviews and collections."
        />
      </PageContainer>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return (
      <PageContainer className="space-y-6">
        <h1 className="text-2xl font-bold sm:text-3xl">My World</h1>
        <EmptyState
          icon={LogIn}
          title="Sign in to view your profile"
          description="Manage your public profile, reviews and custom collections."
          action={
            <Button asChild>
              <Link href="/login?next=/profile">Sign in</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const [profile, reviews, collections] = await Promise.all([
    getOwnProfile(),
    getReviewsByUser(user.id),
    getOwnCollections(),
  ]);

  const displayName =
    profile?.displayName ?? user.email?.split("@")[0] ?? "You";
  const publicUrl =
    profile?.isPublic && profile.publicSlug
      ? `${publicEnv.siteUrl}/profile/${profile.publicSlug}`
      : null;

  return (
    <PageContainer className="space-y-8">
      <ProfileHeader
        displayName={displayName}
        avatarUrl={profile?.avatarUrl ?? null}
        bio={profile?.bio ?? null}
        creatorVerified={profile?.creatorVerified}
      >
        {publicUrl ? (
          <>
            <CopyLinkButton url={publicUrl} label="Copy public link" />
            <Button asChild variant="outline" size="sm">
              <Link href={`/profile/${profile!.publicSlug}`}>
                <ExternalLink className="size-4" />
                View public
              </Link>
            </Button>
          </>
        ) : null}
      </ProfileHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/watchlist"
          className="glass flex items-center gap-3 rounded-xl p-4 transition hover:border-primary/40"
        >
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Bookmark className="size-5" />
          </div>
          <div>
            <p className="font-medium">Watchlist</p>
            <p className="text-sm text-muted-foreground">Titles saved for later</p>
          </div>
        </Link>
        <Link
          href="/collections"
          className="glass flex items-center gap-3 rounded-xl p-4 transition hover:border-primary/40"
        >
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ListVideo className="size-5" />
          </div>
          <div>
            <p className="font-medium">Collections</p>
            <p className="text-sm text-muted-foreground">
              {collections.length} curated{" "}
              {collections.length === 1 ? "list" : "lists"}
            </p>
          </div>
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold sm:text-xl">Profile</h2>
        <ProfileForm
          siteUrl={publicEnv.siteUrl}
          initial={{
            displayName,
            bio: profile?.bio ?? "",
            avatarUrl: profile?.avatarUrl ?? "",
            publicSlug: profile?.publicSlug ?? "",
            isPublic: profile?.isPublic ?? false,
          }}
        />
      </section>

      {collections.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold sm:text-xl">Your collections</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/collections">View all</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.slice(0, 3).map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold sm:text-xl">Your reviews</h2>
        {reviews.length > 0 ? (
          <UserReviews reviews={reviews} />
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            <Star className="size-4" />
            You haven&apos;t written any reviews yet.
          </div>
        )}
      </section>
    </PageContainer>
  );
}
