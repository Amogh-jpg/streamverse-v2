import { BadgeCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function initialsFrom(name: string | null): string {
  if (!name) return "U";
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export function ProfileHeader({
  displayName,
  avatarUrl,
  bio,
  creatorVerified = false,
  children,
}: {
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  creatorVerified?: boolean;
  children?: React.ReactNode;
}) {
  const name = displayName ?? "StreamVerse member";
  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
      <Avatar className="size-16 border border-border">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="text-lg">
          {initialsFrom(displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-2xl font-bold">{name}</h1>
          {creatorVerified ? (
            <BadgeCheck className="size-5 text-primary" aria-label="Verified creator" />
          ) : null}
        </div>
        {bio ? (
          <p className="max-w-prose text-sm text-muted-foreground">{bio}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
