"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ListPlus, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  addToCollection,
  removeFromCollection,
  createCollection,
} from "@/app/actions/collections";

export interface CollectionOption {
  id: string;
  name: string;
  itemCount: number;
  containsItem: boolean;
}

interface AddToCollectionProps {
  mediaType: string;
  mediaId: string;
  isAuthenticated: boolean;
  collections: CollectionOption[];
}

export function AddToCollection({
  mediaType,
  mediaId,
  isAuthenticated,
  collections: initial,
}: AddToCollectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionOption[]>(initial);
  const [newName, setNewName] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  function handleTrigger() {
    if (!isAuthenticated) {
      const next =
        typeof window !== "undefined" ? window.location.pathname : "/";
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setOpen(true);
  }

  async function toggle(option: CollectionOption) {
    setPendingId(option.id);
    const payload = { collectionId: option.id, mediaType, mediaId };
    const result = option.containsItem
      ? await removeFromCollection(payload)
      : await addToCollection(payload);
    setPendingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCollections((prev) =>
      prev.map((c) =>
        c.id === option.id
          ? {
              ...c,
              containsItem: !option.containsItem,
              itemCount: c.itemCount + (option.containsItem ? -1 : 1),
            }
          : c,
      ),
    );
    toast.success(
      option.containsItem ? "Removed from collection." : "Added to collection.",
    );
    router.refresh();
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    startCreate(async () => {
      const created = await createCollection({ name, isPublic: false });
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      const added = await addToCollection({
        collectionId: created.id,
        mediaType,
        mediaId,
      });
      if (!added.ok) {
        toast.error(added.error);
        return;
      }
      setCollections((prev) => [
        { id: created.id, name, itemCount: 1, containsItem: true },
        ...prev,
      ]);
      setNewName("");
      toast.success(`Added to “${name}”.`);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={handleTrigger}>
        <ListPlus className="size-4" />
        Add to collection
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to a collection</DialogTitle>
            <DialogDescription>
              Curate your own lists of titles. Toggle a collection to add or
              remove this title.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {collections.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                You don&apos;t have any collections yet. Create one below.
              </p>
            ) : (
              collections.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option)}
                  disabled={pendingId === option.id}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    option.containsItem
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 hover:bg-muted",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {option.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.itemCount}{" "}
                      {option.itemCount === 1 ? "title" : "titles"}
                    </span>
                  </span>
                  {pendingId === option.id ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : option.containsItem ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Plus className="size-4 text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-border/60 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection name"
              maxLength={80}
              aria-label="New collection name"
            />
            <Button type="submit" size="sm" disabled={isCreating || !newName.trim()}>
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
