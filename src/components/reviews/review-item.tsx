import Link from "next/link";

import type { Review } from "@/lib/reviews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";
import { StarRating } from "./star-rating";

function initials(name: string | null): string {
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

export function ReviewItem({
  review,
  highlight = false,
}: {
  review: Review;
  highlight?: boolean;
}) {
  const name = review.author?.displayName ?? "StreamVerse member";
  const slug = review.author?.publicSlug;

  return (
    <article
      className={
        highlight
          ? "rounded-xl border border-primary/30 bg-primary/5 p-4"
          : "rounded-xl border border-border/60 p-4"
      }
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-9 border border-border">
          {review.author?.avatarUrl ? (
            <AvatarImage src={review.author.avatarUrl} alt={name} />
          ) : null}
          <AvatarFallback>{initials(review.author?.displayName ?? null)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {slug ? (
              <Link
                href={`/profile/${slug}`}
                className="text-sm font-medium hover:underline"
              >
                {name}
              </Link>
            ) : (
              <span className="text-sm font-medium">{name}</span>
            )}
            {highlight ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                You
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </span>
          </div>
          {review.rating ? (
            <StarRating value={review.rating} readOnly size="sm" />
          ) : null}
          {review.body ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {review.body}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
