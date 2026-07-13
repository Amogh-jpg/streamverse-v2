import Link from "next/link";
import { notFound } from "next/navigation";
import { Film, Globe, Lock } from "lucide-react";
import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { EmptyState } from "@/components/common/empty-state";
import { CopyLinkButton } from "@/components/common/copy-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/media/media-card";
import { CollectionItemCard } from "@/components/collections/collection-item-card";
import { CollectionSettings } from "@/components/collections/collection-settings";
import { publicEnv } from "@/lib/env";
import { getCollectionById } from "@/lib/collections";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const collection = await getCollectionById(id);
  if (!collection) return { title: "Collection" };
  return {
    title: collection.name,
    description:
      collection.description ?? `A StreamVerse collection of ${collection.itemCount} titles.`,
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getCollectionById(id);
  if (!collection) notFound();

  const publicUrl = `${publicEnv.siteUrl}/collections/${collection.id}`;

  return (
    <PageContainer className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/collections" className="hover:text-foreground">
          Collections
        </Link>
        <span>/</span>
        <span className="truncate">{collection.name}</span>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{collection.name}</h1>
            <Badge variant="secondary" className="gap-1">
              {collection.isPublic ? (
                <>
                  <Globe className="size-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="size-3" /> Private
                </>
              )}
            </Badge>
          </div>
          {collection.description ? (
            <p className="max-w-prose text-sm text-muted-foreground">
              {collection.description}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {collection.itemCount}{" "}
            {collection.itemCount === 1 ? "title" : "titles"}
            {!collection.isOwner && collection.ownerName
              ? ` · by ${collection.ownerName}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {collection.isPublic ? (
            <CopyLinkButton url={publicUrl} label="Share" />
          ) : null}
          {collection.isOwner ? (
            <CollectionSettings
              id={collection.id}
              initialName={collection.name}
              initialDescription={collection.description ?? ""}
              initialIsPublic={collection.isPublic}
            />
          ) : null}
        </div>
      </header>

      {collection.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {collection.items.map((item) =>
            collection.isOwner ? (
              <CollectionItemCard
                key={item.id}
                collectionId={collection.id}
                item={item}
              />
            ) : (
              <MediaCard key={item.id} item={item} />
            ),
          )}
        </div>
      ) : (
        <EmptyState
          icon={Film}
          title="This collection is empty"
          description={
            collection.isOwner
              ? "Add titles from any movie or show page using “Add to collection”."
              : "There's nothing here yet."
          }
          action={
            collection.isOwner ? (
              <Button asChild>
                <Link href="/movies">Browse movies</Link>
              </Button>
            ) : undefined
          }
        />
      )}
    </PageContainer>
  );
}
