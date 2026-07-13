"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const VALUES = Array.from({ length: 10 }, (_, i) => i + 1);

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
  size?: "sm" | "md";
}

/**
 * A 1–10 star rating control. Interactive when `onChange` is provided,
 * otherwise a read-only display. Fully keyboard-accessible.
 */
export function StarRating({
  value,
  onChange,
  readOnly = false,
  className,
  size = "md",
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value ?? 0;
  const interactive = !readOnly && Boolean(onChange);
  const starSize = size === "sm" ? "size-3.5" : "size-5";

  return (
    <div
      className={cn("flex flex-wrap items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "Rating out of 10" : undefined}
      onMouseLeave={() => setHover(null)}
    >
      {VALUES.map((v) => {
        const filled = v <= active;
        const star = (
          <Star
            className={cn(
              starSize,
              filled
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground/50",
            )}
          />
        );
        if (!interactive) {
          return <span key={v}>{star}</span>;
        }
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={`${v} out of 10`}
            className="rounded outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
            onMouseEnter={() => setHover(v)}
            onFocus={() => setHover(v)}
            onClick={() => onChange?.(v)}
          >
            {star}
          </button>
        );
      })}
      {value ? (
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">
          {value}/10
        </span>
      ) : null}
    </div>
  );
}
