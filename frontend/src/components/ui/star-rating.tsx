"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const dims = size === "sm" ? "size-4" : size === "lg" ? "size-8" : "size-6";

  return (
    <div className={cn("flex items-center gap-1", !readOnly && "cursor-pointer")} role={readOnly ? undefined : "radiogroup"} aria-label="Rating">
      {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className="disabled:cursor-default"
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(null)}
          onClick={() => !readOnly && onChange?.(star)}
        >
          <Star
            className={cn(dims, "transition-colors", star <= shown ? "fill-[var(--warning)] text-[var(--warning)]" : "fill-transparent text-[var(--border-strong)]")}
          />
        </button>
      ))}
    </div>
  );
}
