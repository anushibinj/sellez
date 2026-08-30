"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Input, Skeleton } from "@/components/ui/field";

type Item = { publicId: string; title: string; status: string; sellerAlias: string };

export default function AdminListings() {
  const queryClient = useQueryClient();
  const queue = useQuery({ queryKey: ["admin-listings"], queryFn: () => api<Item[]>("/admin/listings?status=UNDER_REVIEW") });
  if (queue.isLoading) return <Skeleton className="h-48" />;
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">Review queue</h1>
      {(queue.data ?? []).length === 0 && <Card>Nothing waiting.</Card>}
      {(queue.data ?? []).map((item) => (
        <Card key={item.publicId} className="space-y-3">
          <h2 className="text-2xl">{item.title}</h2>
          <p className="text-sm text-[var(--muted)]">Seller alias {item.sellerAlias} · {item.publicId}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={async () => { await api(`/admin/listings/${item.publicId}/approve`, { method: "POST" }); queryClient.invalidateQueries({ queryKey: ["admin-listings"] }); }}>Approve</Button>
            <form className="flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              const reason = new FormData(e.currentTarget).get("reason") as string;
              await api(`/admin/listings/${item.publicId}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
              queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
            }}>
              <Input name="reason" placeholder="Rejection reason" required />
              <Button variant="danger">Reject</Button>
            </form>
            <form className="flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              const reason = new FormData(e.currentTarget).get("reason") as string;
              await api(`/admin/listings/${item.publicId}/return`, { method: "POST", body: JSON.stringify({ reason }) });
              queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
            }}>
              <Input name="reason" placeholder="Return reason" required />
              <Button variant="outline">Return</Button>
            </form>
          </div>
        </Card>
      ))}
    </div>
  );
}
