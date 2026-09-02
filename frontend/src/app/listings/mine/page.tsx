"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ImageOff, PlusCircle, Undo2 } from "lucide-react";
import { api } from "@/lib/api";
import { ListingDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPrice } from "@/lib/utils";

export default function MyListingsPage() {
  const queryClient = useQueryClient();
  const mine = useQuery({ queryKey: ["mine"], queryFn: () => api<ListingDetail[]>("/listings/mine") });
  const [revoking, setRevoking] = useState<string | null>(null);

  if (mine.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }
  const items = mine.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="My listings"
        actions={<Button asChild><Link href="/listings/new"><PlusCircle className="size-4" /> New</Link></Button>}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="No listings yet"
          description="Create your first listing to start selling in your community."
          action={<Button asChild><Link href="/listings/new">Create listing</Link></Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.publicId} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <Link className="text-sm font-medium hover:text-[var(--accent)] hover:underline" href={`/listing/${item.publicId}`}>{item.title}</Link>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-sm text-[var(--muted-foreground)]">{formatPrice(item.price, item.currency)}</span>
                </div>
                {item.status === "TAKEN_DOWN" && item.takedownReason && (
                  <p className="flex items-start gap-1.5 text-sm text-[var(--danger)]">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {item.takedownReason}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {item.status === "UNDER_REVIEW" && (
                  <Button variant="outline" size="sm" onClick={() => setRevoking(item.publicId)}>
                    <Undo2 className="size-3.5" /> Revoke
                  </Button>
                )}
                {item.status !== "SOLD" && <Button variant="ghost" size="sm" asChild><Link href={`/listings/${item.publicId}/edit`}>Edit</Link></Button>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="Revoke this listing?"
        description="It will move back to drafts and stop being reviewed by admins."
        confirmLabel="Revoke"
        onConfirm={async () => {
          if (!revoking) return;
          await api(`/listings/${revoking}/revoke`, { method: "POST" });
          toast.success("Listing revoked.");
          queryClient.invalidateQueries({ queryKey: ["mine"] });
        }}
      />
    </div>
  );
}
