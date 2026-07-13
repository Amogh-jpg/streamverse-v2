"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateCollection, deleteCollection } from "@/app/actions/collections";

interface CollectionSettingsProps {
  id: string;
  initialName: string;
  initialDescription: string;
  initialIsPublic: boolean;
}

export function CollectionSettings({
  id,
  initialName,
  initialDescription,
  initialIsPublic,
}: CollectionSettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startSave(async () => {
      const result = await updateCollection({ id, name, description, isPublic });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection updated.");
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteCollection(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection deleted.");
      router.push("/collections");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Settings2 className="size-4" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collection settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <Label htmlFor="edit-public">Public</Label>
            <Switch
              id="edit-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          <Button type="submit" disabled={isSaving || !name.trim()}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </form>

        <div className="mt-2 border-t border-border/60 pt-4">
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Delete this collection and all its items? This can&apos;t be
                undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Yes, delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" />
              Delete collection
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
