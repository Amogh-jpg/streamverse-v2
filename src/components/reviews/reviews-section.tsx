import { MessageSquare, Star } from "lucide-react";

import {
  getReviewsForMedia,
  getOwnReviewForMedia,
  getMediaRatingSummary,
} from "@/lib/reviews";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";
import { ReviewItem } from "./review-item";

/**
 * Server component that renders the community reviews block for a title:
 * aggregate rating, the signed-in user's own review editor, and everyone
 * else's reviews. Rendered inside the shared media detail view.
 */
export async function ReviewsSection({
  mediaType,
  mediaId,
}: {
  mediaType: string;
  mediaId: string;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold sm:text-xl">Reviews</h2>
        <p className="text-sm text-muted-foreground">
          Sign-in and reviews become available once Supabase is configured.
        </p>
      </section>
    );
  }

  const [user, reviews, ownReview, summary] = await Promise.all([
    getCurrentUser(),
    getReviewsForMedia(mediaType, mediaId),
    getOwnReviewForMedia(mediaType, mediaId),
    getMediaRatingSummary(mediaType, mediaId),
  ]);

  const others = reviews.filter((r) => r.userId !== user?.id);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold sm:text-xl">Reviews</h2>
        {summary.average !== null ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-foreground">
              {summary.average.toFixed(1)}
            </span>
            /10 · {summary.count}{" "}
            {summary.count === 1 ? "review" : "reviews"}
          </span>
        ) : null}
      </div>

      <ReviewForm
        mediaType={mediaType}
        mediaId={mediaId}
        isAuthenticated={Boolean(user)}
        initialRating={ownReview?.rating ?? null}
        initialBody={ownReview?.body ?? null}
        hasExisting={Boolean(ownReview)}
      />

      {others.length > 0 ? (
        <div className="space-y-3">
          {others.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
          <MessageSquare className="size-4" />
          No community reviews yet — be the first.
        </div>
      )}
    </section>
  );
}
