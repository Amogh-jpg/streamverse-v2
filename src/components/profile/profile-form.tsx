"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateProfile } from "@/app/actions/profile";

export interface ProfileFormValues {
  displayName: string;
  bio: string;
  avatarUrl: string;
  publicSlug: string;
  isPublic: boolean;
}

export function ProfileForm({
  initial,
  siteUrl,
}: {
  initial: ProfileFormValues;
  siteUrl: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileFormValues>(initial);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfile(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile saved.");
      router.refresh();
    });
  }

  const slugPreview = values.publicSlug.trim();

  return (
    <form onSubmit={handleSubmit} className="glass space-y-5 rounded-2xl p-5">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={values.displayName}
          onChange={(e) => set("displayName", e.target.value)}
          maxLength={60}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Tell people what you're into…"
        />
        <p className="text-xs text-muted-foreground">
          {values.bio.length}/280
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input
          id="avatarUrl"
          type="url"
          value={values.avatarUrl}
          onChange={(e) => set("avatarUrl", e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="publicSlug">Public profile URL</Label>
        <Input
          id="publicSlug"
          value={values.publicSlug}
          onChange={(e) => set("publicSlug", e.target.value)}
          placeholder="your-handle"
          maxLength={40}
        />
        <p className="text-xs text-muted-foreground">
          {slugPreview
            ? `${siteUrl}/profile/${slugPreview}`
            : "Choose a handle to get a shareable profile link."}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
        <div className="space-y-0.5">
          <Label htmlFor="isPublic">Public profile</Label>
          <p className="text-xs text-muted-foreground">
            Let anyone with the link view your profile, public collections and
            reviews.
          </p>
        </div>
        <Switch
          id="isPublic"
          checked={values.isPublic}
          onCheckedChange={(checked) => set("isPublic", checked)}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Save profile
      </Button>
    </form>
  );
}
