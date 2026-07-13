"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import type { MediaItem } from "@/types/media-item";
import { MediaCard } from "@/components/media/media-card";
import { Button } from "@/components/ui/button";
import { removeFromCollection } from "@/app/actions/collections";

/** A media card with a remove control, shown to collection owners. */
export function CollectionItemCard({
  collectionId,
  item,
}: {
  collectionId: string;
  item: MediaItem;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await removeFromCollection({
        collectionId,
        mediaType: item.type,
        mediaId: item.externalId,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Removed from collection.");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <MediaCard item={item} />
      <div className="absolute right-2 top-2 z-10">
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="rounded-full"
          onClick={handleRemove}
          disabled={isPending}
          aria-label={`Remove ${item.title} from collection`}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
