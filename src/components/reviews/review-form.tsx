"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { upsertReview, deleteReview } from "@/app/actions/reviews";

interface ReviewFormProps {
  mediaType: string;
  mediaId: string;
  isAuthenticated: boolean;
  initialRating: number | null;
  initialBody: string | null;
  hasExisting: boolean;
}

export function ReviewForm({
  mediaType,
  mediaId,
  isAuthenticated,
  initialRating,
  initialBody,
  hasExisting,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(initialRating);
  const [body, setBody] = useState(initialBody ?? "");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  if (!isAuthenticated) {
    return (
      <div className="glass rounded-xl p-4 text-sm text-muted-foreground">
        <Button asChild size="sm" variant="secondary">
          <Link
            href={`/login?next=${encodeURIComponent(
              `/${mediaType === "tv" ? "tv" : "movies"}/${mediaId}`,
            )}`}
          >
            Sign in to write a review
          </Link>
        </Button>
      </div>
    );
  }

  function handleSubmit() {
    if (!rating) {
      toast.error("Pick a rating first.");
      return;
    }
    startTransition(async () => {
      const result = await upsertReview({ mediaType, mediaId, rating, body });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(hasExisting ? "Review updated." : "Review posted.");
      router.refresh();
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteReview({ mediaType, mediaId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRating(null);
      setBody("");
      toast.success("Review deleted.");
      router.refresh();
    });
  }

  return (
    <div className="glass space-y-3 rounded-xl p-4">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">
          {hasExisting ? "Your review" : "Write a review"}
        </p>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share what you thought (optional)…"
        maxLength={4000}
        rows={4}
        aria-label="Review text"
      />
      <div className="flex items-center gap-2">
        <Button onClick={handleSubmit} disabled={isPending} size="sm">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {hasExisting ? "Update review" : "Post review"}
        </Button>
        {hasExisting ? (
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            size="sm"
            variant="destructive"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
