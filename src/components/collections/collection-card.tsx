import Link from "next/link";
import { Globe, ListVideo, Lock } from "lucide-react";

import type { Collection } from "@/lib/collections";

export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="glass group flex flex-col gap-2 rounded-2xl p-4 outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <ListVideo className="size-5" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {collection.isPublic ? (
            <>
              <Globe className="size-3" /> Public
            </>
          ) : (
            <>
              <Lock className="size-3" /> Private
            </>
          )}
        </span>
      </div>
      <h3 className="line-clamp-1 font-semibold">{collection.name}</h3>
      {collection.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {collection.description}
        </p>
      ) : null}
      <p className="mt-auto text-xs text-muted-foreground">
        {collection.itemCount} {collection.itemCount === 1 ? "title" : "titles"}
      </p>
    </Link>
  );
}
