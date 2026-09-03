"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, MessageSquareWarning, ThumbsDown, ThumbsUp } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Input, Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

type ListingAppeal = {
  id: string;
  listingPublicId: string;
  listingTitle: string;
  listingPrice: number;
  listingCurrency: string;
  takedownReason: string | null;
  message: string;
  status: string;
  sellerAlias: string;
  createdAt: string;
};

export default function AdminAppeals() {
  const queryClient = useQueryClient();
  const appeals = useQuery({ queryKey: ["admin-listing-appeals"], queryFn: () => api<ListingAppeal[]>("/admin/listing-appeals") });
  const [resolving, setResolving] = useState<string | null>(null);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-listing-appeals"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dash"] });
  }

  if (appeals.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }
  const items = appeals.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Listing appeals" description="Sellers appealing a takedown decision, waiting on your review." />
      {items.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="No appeals waiting" description="Appeals from sellers whose listings were taken down will show up here." />
      ) : (
        items.map((appeal) => (
          <Card key={appeal.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/listing/${appeal.listingPublicId}`} className="text-sm font-semibold hover:text-[var(--accent)] hover:underline">
                  {appeal.listingTitle}
                </Link>
                <Badge tone={appeal.status === "PENDING" ? "warning" : appeal.status === "APPROVED" ? "success" : "danger"}>
                  {appeal.status.toLowerCase()}
                </Badge>
              </div>
              <span className="text-sm font-semibold">{formatPrice(appeal.listingPrice, appeal.listingCurrency)}</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Seller alias {appeal.sellerAlias} · {new Date(appeal.createdAt).toLocaleString()}</p>

            {appeal.takedownReason && (
              <p className="flex items-start gap-1.5 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-3 text-sm text-[var(--muted-foreground)]">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span><span className="font-medium text-[var(--foreground)]">Takedown reason: </span>{appeal.takedownReason}</span>
              </p>
            )}
            <p className="text-sm">{appeal.message}</p>

            {appeal.status === "PENDING" && (
              <form
                className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const note = new FormData(e.currentTarget).get("note") as string;
                  const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                  const approve = submitter?.value === "approve";
                  setResolving(appeal.id);
                  try {
                    await api(`/admin/listing-appeals/${appeal.id}/resolve`, { method: "POST", body: JSON.stringify({ approve, note }) });
                    toast.success(approve ? "Appeal approved — listing restored." : "Appeal denied.");
                    refresh();
                  } finally {
                    setResolving(null);
                  }
                }}
              >
                <Input name="note" placeholder="Note to the seller (optional)" className="min-w-0 flex-1" />
                <Button name="approve" value="deny" variant="outline" loading={resolving === appeal.id}>
                  <ThumbsDown className="size-4" /> Deny
                </Button>
                <Button name="approve" value="approve" loading={resolving === appeal.id}>
                  <ThumbsUp className="size-4" /> Approve &amp; restore
                </Button>
              </form>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
