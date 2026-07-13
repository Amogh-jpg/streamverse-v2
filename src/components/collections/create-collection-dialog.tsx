"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCollection } from "@/app/actions/collections";

export function CreateCollectionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCollection({ name, description, isPublic });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection created.");
      setOpen(false);
      setName("");
      setDescription("");
      setIsPublic(false);
      router.push(`/collections/${result.id}`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a collection</DialogTitle>
          <DialogDescription>
            Group titles into a themed list you can keep private or share.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <Label htmlFor="new-public">Make public</Label>
            <Switch
              id="new-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          <Button type="submit" disabled={isPending || !name.trim()}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create collection
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
