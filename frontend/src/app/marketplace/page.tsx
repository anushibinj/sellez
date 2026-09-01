"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LayoutGrid, List, PlusCircle, Search, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORIES, ListingCard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select, Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { ListingCardGrid, ListingCardRow } from "@/components/listing-card";

type Page = { content: ListingCard[]; last: boolean; number: number };
type ViewMode = "list" | "grid";

function SortSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select aria-label="Sort" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="newest">Newest</option>
      <option value="updated">Recently updated</option>
      <option value="rating">Seller rating</option>
    </Select>
  );
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select aria-label="Category" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All categories</option>
      {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
    </Select>
  );
}

export default function MarketplacePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<ViewMode>("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const params = useMemo(() => ({ q, category, minPrice, maxPrice, sort }), [q, category, minPrice, maxPrice, sort]);
  const activeFilterCount = [category, minPrice, maxPrice].filter(Boolean).length;

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

  const ViewToggle = (
    <div className="flex shrink-0 gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border-strong)] p-0.5">
      <button
        type="button"
        aria-label="List view"
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
        className={`flex size-8 items-center justify-center rounded-[6px] transition-colors ${view === "list" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)]"}`}
      >
        <List className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        onClick={() => setView("grid")}
        className={`flex size-8 items-center justify-center rounded-[6px] transition-colors ${view === "grid" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)]"}`}
      >
        <LayoutGrid className="size-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Your community only"
        title="Marketplace"
        description="Only verified members of your community can see listings."
        actions={
          <Button asChild className="hidden md:inline-flex">
            <Link href="/listings/new"><PlusCircle className="size-4" /> Create listing</Link>
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input className="pl-9" placeholder="Search listings" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search listings" />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="relative shrink-0 md:hidden"
          aria-label="Filters"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal className="size-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-[var(--accent-foreground)]">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <div className="w-40"><CategorySelect value={category} onChange={setCategory} /></div>
          <Input className="w-20" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputMode="decimal" aria-label="Minimum price" />
          <Input className="w-20" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="decimal" aria-label="Maximum price" />
          <div className="w-44"><SortSelect value={sort} onChange={setSort} /></div>
        </div>
        {ViewToggle}
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom">
          <DialogTitle>Filters</DialogTitle>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">Category</p>
              <CategorySelect value={category} onChange={setCategory} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">Min price</p>
                <Input placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">Max price</p>
                <Input placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">Sort by</p>
              <SortSelect value={sort} onChange={setSort} />
            </div>
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>Show results</Button>
          </div>
        </SheetContent>
      </Dialog>

      {listings.isLoading ? (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className={view === "grid" ? "h-56" : "h-24"} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No listings yet"
          description={q || category || minPrice || maxPrice ? "Try a different search or clear your filters." : "Be the first to list something in your community."}
          action={<Button asChild><Link href="/listings/new">Create the first listing</Link></Button>}
        />
      ) : (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {items.map((item) => view === "grid" ? <ListingCardGrid key={item.publicId} item={item} /> : <ListingCardRow key={item.publicId} item={item} />)}
        </div>
      )}

      {listings.hasNextPage && (
        <div className="pt-2 text-center">
          <Button variant="outline" onClick={() => listings.fetchNextPage()} loading={listings.isFetchingNextPage}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
