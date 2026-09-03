"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ImageOff, ListChecks, RefreshCcw, RotateCcw, ShieldOff, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Select, Skeleton, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { CATEGORIES } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type Item = {
  publicId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  status: string;
  sellerAlias: string;
  takedownReason: string | null;
};

const STATUS_FILTERS = [
  { value: "UNDER_REVIEW", label: "Pending review" },
  { value: "ACTIVE", label: "Active" },
  { value: "TAKEN_DOWN", label: "Taken down" },
  { value: "SOLD", label: "Sold" },
  { value: "DRAFT", label: "Draft" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REVOKED", label: "Revoked" },
  { value: "", label: "All listings" },
] as const;

function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actionLabel: string;
  destructive?: boolean;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description ?? "This is shared with the seller so they understand what to fix."}</DialogDescription>
        <Textarea className="mt-4" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={destructive ? "danger" : "default"} onClick={handleConfirm} loading={loading} disabled={!reason.trim()}>
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminListings() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("UNDER_REVIEW");
  const queue = useQuery({
    queryKey: ["admin-listings", statusFilter],
    queryFn: () => api<Item[]>(`/admin/listings${statusFilter ? `?status=${statusFilter}` : ""}`),
  });
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [returning, setReturning] = useState<string | null>(null);
  const [takingDown, setTakingDown] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
  }

  if (queue.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
      </div>
    );
  }
  const items = queue.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Listings"
        description="Review submissions, moderate live listings, and make anything you've taken down available again."
        actions={
          <Select aria-label="Status" className="w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nothing here" description="No listings currently match this filter." />
      ) : (
        items.map((item) => (
          <Card key={item.publicId} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-2)] sm:w-48">
                {item.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]"><ImageOff className="size-6" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{item.title}</h2>
                    <StatusBadge status={item.status} />
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(item.price, item.currency)}</span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">Seller alias {item.sellerAlias} · {item.publicId}</p>
                <p className="line-clamp-3 text-sm text-[var(--muted-foreground)]">{item.description}</p>
                {item.status === "TAKEN_DOWN" && item.takedownReason && (
                  <p className="flex items-start gap-1.5 text-sm text-[var(--danger)]">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {item.takedownReason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
              <Select
                aria-label="Category"
                defaultValue={item.category}
                className="w-44"
                onChange={async (e) => {
                  await api(`/admin/listings/${item.publicId}/category`, { method: "PATCH", body: JSON.stringify({ category: e.target.value }) });
                  toast.success("Category updated.");
                  refresh();
                }}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </Select>
              <div className="ml-auto flex flex-wrap gap-2">
                {item.status === "UNDER_REVIEW" && (
                  <>
                    <Button variant="outline" onClick={() => setReturning(item.publicId)}>
                      <RotateCcw className="size-4" /> Return
                    </Button>
                    <Button variant="danger" onClick={() => setRejecting(item.publicId)}>
                      <XCircle className="size-4" /> Reject
                    </Button>
                    <Button
                      loading={approving === item.publicId}
                      onClick={async () => {
                        setApproving(item.publicId);
                        try {
                          await api(`/admin/listings/${item.publicId}/approve`, { method: "POST" });
                          toast.success("Listing approved.");
                          refresh();
                        } finally {
                          setApproving(null);
                        }
                      }}
                    >
                      <CheckCircle2 className="size-4" /> Approve
                    </Button>
                  </>
                )}
                {(item.status === "ACTIVE" || item.status === "SOLD") && (
                  <Button variant="danger" onClick={() => setTakingDown(item.publicId)}>
                    <ShieldOff className="size-4" /> Take down
                  </Button>
                )}
                {item.status === "TAKEN_DOWN" && (
                  <Button
                    loading={restoring === item.publicId}
                    onClick={async () => {
                      setRestoring(item.publicId);
                      try {
                        await api(`/admin/listings/${item.publicId}/restore`, { method: "POST" });
                        toast.success("Listing is available again.");
                        refresh();
                      } finally {
                        setRestoring(null);
                      }
                    }}
                  >
                    <RefreshCcw className="size-4" /> Make available again
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))
      )}

      <ReasonDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Reject this listing"
        actionLabel="Reject listing"
        destructive
        onConfirm={async (reason) => {
          await api(`/admin/listings/${rejecting}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
          toast.success("Listing rejected.");
          refresh();
        }}
      />
      <ReasonDialog
        open={returning !== null}
        onOpenChange={(open) => !open && setReturning(null)}
        title="Return to draft"
        actionLabel="Return listing"
        onConfirm={async (reason) => {
          await api(`/admin/listings/${returning}/return`, { method: "POST", body: JSON.stringify({ reason }) });
          toast.success("Listing returned to the seller.");
          refresh();
        }}
      />
      <ReasonDialog
        open={takingDown !== null}
        onOpenChange={(open) => !open && setTakingDown(null)}
        title="Take down this listing"
        description='The listing will be removed from the marketplace immediately. The seller will be emailed the reason and can see it in "My listings".'
        actionLabel="Take down listing"
        destructive
        onConfirm={async (reason) => {
          await api(`/admin/listings/${takingDown}/takedown`, { method: "POST", body: JSON.stringify({ reason }) });
          toast.success("Listing taken down.");
          refresh();
        }}
      />
    </div>
  );
}
