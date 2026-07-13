import Link from "next/link";
import { ListVideo, LogIn } from "lucide-react";
import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { ConfigNotice } from "@/components/common/config-notice";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { CollectionCard } from "@/components/collections/collection-card";
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { getOwnCollections } from "@/lib/collections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description: "Your curated collections of movies and shows.",
};

export default async function CollectionsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageContainer className="space-y-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Collections</h1>
        <ConfigNotice
          service="Supabase"
          detail="Add Supabase credentials to create and manage collections."
        />
      </PageContainer>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return (
      <PageContainer className="space-y-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Collections</h1>
        <EmptyState
          icon={LogIn}
          title="Sign in to build collections"
          description="Group titles into themed lists you can keep private or share."
          action={
            <Button asChild>
              <Link href="/login?next=/collections">Sign in</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const collections = await getOwnCollections();

  return (
    <PageContainer className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Collections</h1>
          <p className="text-sm text-muted-foreground">
            {collections.length} curated{" "}
            {collections.length === 1 ? "list" : "lists"}
          </p>
        </div>
        <CreateCollectionDialog />
      </header>

      {collections.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ListVideo}
          title="No collections yet"
          description="Create your first collection, then add titles from any movie or show page."
          action={<CreateCollectionDialog />}
        />
      )}
    </PageContainer>
  );
}
