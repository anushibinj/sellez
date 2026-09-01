import Link from "next/link";
import { ImageOff, Star } from "lucide-react";
import { ListingCard as ListingCardData } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/field";
import { cn } from "@/lib/utils";

function Thumb({ src, className }: { src: string | null; className?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden bg-[var(--surface-2)]", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">
          <ImageOff className="size-5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export function ListingCardGrid({ item }: { item: ListingCardData }) {
  return (
    <Link href={`/listing/${item.publicId}`} className="group block">
      <Card className="overflow-hidden p-0 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
        <Thumb src={item.coverImage} className="aspect-[4/3] w-full" />
        <div className="space-y-1.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)]">{item.title}</h2>
            <span className="shrink-0 text-sm font-semibold">{formatPrice(item.price, item.currency)}</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {item.category.replace(/_/g, " ").toLowerCase()} · {item.condition.replace(/_/g, " ").toLowerCase()}
          </p>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: item.sellerColor }}>
            <span className="font-medium">{item.sellerAlias}</span>
            <span className="inline-flex items-center gap-0.5 text-[var(--muted-foreground)]">
              <Star className="size-3 fill-[var(--warning)] text-[var(--warning)]" />
              {Number(item.sellerRating).toFixed(1)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ListingCardRow({ item }: { item: ListingCardData }) {
  return (
    <Link href={`/listing/${item.publicId}`} className="group block">
      <Card className="flex items-center gap-4 p-3 transition-colors duration-150 hover:border-[var(--border-strong)]">
        <Thumb src={item.coverImage} className="size-16 rounded-[var(--radius-md)] sm:size-20" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h2 className="truncate text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)]">{item.title}</h2>
            <span className="shrink-0 text-sm font-semibold">{formatPrice(item.price, item.currency)}</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {item.category.replace(/_/g, " ").toLowerCase()} · {item.condition.replace(/_/g, " ").toLowerCase()}
          </p>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: item.sellerColor }}>
            <span className="font-medium">{item.sellerAlias}</span>
            <span className="inline-flex items-center gap-0.5 text-[var(--muted-foreground)]">
              <Star className="size-3 fill-[var(--warning)] text-[var(--warning)]" />
              {Number(item.sellerRating).toFixed(1)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
