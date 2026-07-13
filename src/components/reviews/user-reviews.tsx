import Link from "next/link";
import Image from "next/image";
import { Film, Tv } from "lucide-react";

import type { ReviewWithMedia } from "@/lib/reviews";
import { mediaHref } from "@/lib/links";
import { formatDate } from "@/lib/format";
import { StarRating } from "./star-rating";

/** Renders a user's reviews as media-linked cards (used on profile pages). */
export function UserReviews({ reviews }: { reviews: ReviewWithMedia[] }) {
  return (
    <ul className="space-y-3">
      {reviews.map((review) => {
        const media = review.media;
        const TypeIcon = review.mediaType === "tv" ? Tv : Film;
        return (
          <li
            key={review.id}
            className="flex gap-3 rounded-xl border border-border/60 p-3"
          >
            <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-md bg-muted">
              {media?.coverImageUrl ? (
                <Image
                  src={media.coverImageUrl}
                  alt={media.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <TypeIcon className="size-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2">
                {media ? (
                  <Link
                    href={mediaHref(media)}
                    className="text-sm font-semibold hover:underline"
                  >
                    {media.title}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">
                    Unavailable title
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              {review.rating ? (
                <StarRating value={review.rating} readOnly size="sm" />
              ) : null}
              {review.body ? (
                <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {review.body}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
