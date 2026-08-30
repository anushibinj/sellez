"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ListingDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/field";
import { formatPrice } from "@/lib/utils";

export default function MyListingsPage() {
  const queryClient = useQueryClient();
  const mine = useQuery({ queryKey: ["mine"], queryFn: () => api<ListingDetail[]>("/listings/mine") });
  if (mine.isLoading) return <Skeleton className="h-64" />;
  const items = mine.data ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl">My listings</h1>
        <Button asChild><Link href="/listings/new">New</Link></Button>
      </div>
      {items.length === 0 ? <Card className="py-16 text-center text-[var(--muted)]">No drafts yet.</Card> : items.map((item) => (
        <Card key={item.publicId} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link className="text-xl underline-offset-4 hover:underline" href={`/listing/${item.publicId}`}>{item.title}</Link>
            <p className="text-sm text-[var(--muted)]">{item.status} · {formatPrice(item.price)}</p>
          </div>
          <div className="flex gap-2">
            {item.status === "UNDER_REVIEW" && (
              <Button variant="outline" onClick={async () => { await api(`/listings/${item.publicId}/revoke`, { method: "POST" }); queryClient.invalidateQueries({ queryKey: ["mine"] }); }}>Revoke</Button>
            )}
            {item.status !== "SOLD" && <Button variant="ghost" asChild><Link href={`/listings/${item.publicId}/edit`}>Edit</Link></Button>}
          </div>
        </Card>
      ))}
    </div>
  );
}
