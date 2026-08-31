"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORIES, ListingCard } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Input, Skeleton } from "@/components/ui/field";

type Page = { content: ListingCard[]; last: boolean; number: number };
type ViewMode = "list" | "grid";

export default function MarketplacePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<ViewMode>("list");
  const params = useMemo(() => ({ q, category, minPrice, maxPrice, sort }), [q, category, minPrice, maxPrice, sort]);

  const listings = useInfiniteQuery({
    queryKey: ["listings", params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const search = new URLSearchParams({ page: String(pageParam), size: "12", sort });
      if (q) search.set("q", q);
      if (category) search.set("category", category);
      if (minPrice) search.set("minPrice", minPrice);
      if (maxPrice) search.set("maxPrice", maxPrice);
      return api<Page>(`/listings?${search}`);
    },
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });

  const items = listings.data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">Your community only</p>
          <h1 className="text-4xl">Marketplace</h1>
          <p className="text-[var(--muted)]">Only verified members of your community can see listings.</p>
        </div>
        <Button asChild><Link href="/listings/new">Create listing</Link></Button>
      </div>
      <Card className="flex flex-wrap items-center gap-2 p-2 sm:p-3 md:flex-nowrap">
        <Input
          className="min-w-0 flex-1"
          placeholder="Search listings"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search listings"
        />
        <select
          className="h-11 w-full shrink-0 rounded-2xl border border-[var(--border)] bg-transparent px-3 text-sm sm:w-auto md:w-40"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Input
          className="w-full min-w-0 sm:w-24"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          inputMode="decimal"
          aria-label="Minimum price"
        />
        <Input
          className="w-full min-w-0 sm:w-24"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          inputMode="decimal"
          aria-label="Maximum price"
        />
        <select
          className="h-11 w-full shrink-0 rounded-2xl border border-[var(--border)] bg-transparent px-3 text-sm sm:w-auto md:w-44"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort"
        >
          <option value="newest">Newest</option>
          <option value="updated">Recently updated</option>
          <option value="rating">Seller rating</option>
        </select>
        <div className="flex shrink-0 gap-1 rounded-2xl border border-[var(--border)] p-1">
          <Button
            type="button"
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-xl px-3"
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List className="size-4" />
          </Button>
          <Button
            type="button"
            variant={view === "grid" ? "default" : "ghost"}
            size="sm"
            className="rounded-xl px-3"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </Card>
      {listings.isLoading ? (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className={view === "grid" ? "h-64" : "h-24"} />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="py-16 text-center text-[var(--muted)]">No listings yet. Be the first in your community.</Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.publicId} href={`/listing/${item.publicId}`} className="group">
              <Card className="overflow-hidden p-0">
                <div className="aspect-[4/3] bg-black/5">
                  {item.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="space-y-1 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl group-hover:underline">{item.title}</h2>
                    <span>{formatPrice(item.price, item.currency)}</span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{item.category} · {item.condition}</p>
                  <p className="text-sm" style={{ color: item.sellerColor }}>{item.sellerAlias} · ★ {Number(item.sellerRating).toFixed(1)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.publicId} href={`/listing/${item.publicId}`} className="group block">
              <Card className={cn("flex items-center gap-4 overflow-hidden p-3")}>
                <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-black/5">
                  {item.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="truncate text-lg group-hover:underline">{item.title}</h2>
                    <span className="shrink-0">{formatPrice(item.price, item.currency)}</span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{item.category} · {item.condition}</p>
                  <p className="text-sm" style={{ color: item.sellerColor }}>{item.sellerAlias} · ★ {Number(item.sellerRating).toFixed(1)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {listings.hasNextPage && (
        <div className="text-center">
          <Button variant="outline" onClick={() => listings.fetchNextPage()}>Load more</Button>
        </div>
      )}
    </div>
  );
}
