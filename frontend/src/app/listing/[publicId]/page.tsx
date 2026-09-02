"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Flag, ImageOff, MapPin, MessageCircle, Pencil, CheckCircle2, ShieldOff } from "lucide-react";
import { api, getMe } from "@/lib/api";
import { ListingDetail, REPORT_REASONS } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Select, Skeleton, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { PrivacyNote } from "@/components/privacy-note";
import { StatusBadge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { EmptyState } from "@/components/ui/empty-state";

export default function ListingDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listing = useQuery({ queryKey: ["listing", publicId], queryFn: () => api<ListingDetail>(`/listings/${publicId}`) });
  const rating = useQuery({
    queryKey: ["rating", publicId],
    queryFn: () => api<{ stars: number } | null>(`/ratings?listingPublicId=${publicId}`),
  });
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  const isAdmin = me.data?.role === "COMMUNITY_ADMIN" || me.data?.role === "SUPER_ADMIN";
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [details, setDetails] = useState("");
  const [stars, setStars] = useState(5);
  const [activeImage, setActiveImage] = useState(0);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [takedownOpen, setTakedownOpen] = useState(false);
  const [takedownReasonInput, setTakedownReasonInput] = useState("");
  const [submittingTakedown, setSubmittingTakedown] = useState(false);

  if (listing.isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }
  if (listing.isError || !listing.data) {
    return <EmptyState title="Listing unavailable" description="This listing is unavailable in your community." />;
  }
  const item = listing.data;

  async function submitReport() {
    setSubmittingReport(true);
    try {
      await api("/reports", { method: "POST", body: JSON.stringify({ reason, details, listingPublicId: item.publicId }) });
      toast.success("Report sent to community moderators.");
      setDetails("");
      setReason("SPAM");
      setReportOpen(false);
    } finally {
      setSubmittingReport(false);
    }
  }

  async function submitTakedown() {
    if (!takedownReasonInput.trim()) return;
    setSubmittingTakedown(true);
    try {
      await api(`/admin/listings/${item.publicId}/takedown`, { method: "POST", body: JSON.stringify({ reason: takedownReasonInput }) });
      toast.success("Listing taken down. The seller has been notified by email.");
      setTakedownReasonInput("");
      setTakedownOpen(false);
      queryClient.invalidateQueries({ queryKey: ["listing", publicId] });
    } finally {
      setSubmittingTakedown(false);
    }
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)]">
            {item.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.images[activeImage]} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">
                <ImageOff className="size-8" />
              </div>
            )}
          </div>
          {item.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {item.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  className={`size-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-colors ${i === activeImage ? "border-[var(--accent)]" : "border-transparent"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              <span>{item.communityName}</span>
              <StatusBadge status={item.status} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h1>
            <p className="text-2xl font-semibold text-[var(--accent)]">{formatPrice(item.price, item.currency)}</p>
          </div>

          {item.owner && item.status === "TAKEN_DOWN" && item.takedownReason && (
            <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--danger-tint)] p-3.5 text-sm text-[var(--danger)]">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Taken down by a community admin</p>
                <p className="mt-0.5">{item.takedownReason}</p>
              </div>
            </div>
          )}

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted-foreground)]">{item.description}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-2.5 py-1 text-[var(--muted-foreground)]">{item.category.replace(/_/g, " ").toLowerCase()}</span>
            <span className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-2.5 py-1 text-[var(--muted-foreground)]">{item.condition.replace(/_/g, " ").toLowerCase()}</span>
            {item.location && (
              <span className="flex items-center gap-1 text-[var(--muted-foreground)]"><MapPin className="size-3.5" /> {item.location}</span>
            )}
          </div>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.seller.alias}</p>
              <p className="text-xs text-[var(--muted-foreground)]">★ {Number(item.seller.ratingAvg).toFixed(1)} · {item.seller.ratingCount} rating{item.seller.ratingCount === 1 ? "" : "s"}</p>
            </div>
            <PrivacyNote>Chats are anonymous. Emails and names are never shown.</PrivacyNote>
          </Card>

          <div className="flex flex-wrap gap-2">
            {!item.owner && item.status === "ACTIVE" && (
              <Button onClick={async () => {
                const chat = await api<{ id: string }>("/chats/start", { method: "POST", body: JSON.stringify({ listingPublicId: item.publicId }) });
                router.push(`/chats/${chat.id}`);
              }}>
                <MessageCircle className="size-4" /> Message seller
              </Button>
            )}
            {!item.owner && (
              <Button variant="outline" onClick={() => setReportOpen(true)}>
                <Flag className="size-4" /> Report
              </Button>
            )}
            {item.owner && item.status === "ACTIVE" && (
              <Button onClick={async () => {
                await api(`/listings/${item.publicId}/sold`, { method: "POST" });
                queryClient.invalidateQueries({ queryKey: ["listing", publicId] });
              }}>
                <CheckCircle2 className="size-4" /> Mark sold
              </Button>
            )}
            {item.owner && <Button variant="outline" onClick={() => router.push(`/listings/${item.publicId}/edit`)}><Pencil className="size-4" /> Edit</Button>}
            {isAdmin && (item.status === "ACTIVE" || item.status === "SOLD") && (
              <Button variant="danger" onClick={() => setTakedownOpen(true)}>
                <ShieldOff className="size-4" /> Take down
              </Button>
            )}
          </div>

          {!item.owner && item.status === "SOLD" && !rating.data && (
            <Card className="space-y-3">
              <h2 className="text-sm font-semibold">Rate this seller</h2>
              <StarRating value={stars} onChange={setStars} />
              <Button
                loading={submittingRating}
                onClick={async () => {
                  setSubmittingRating(true);
                  try {
                    await api("/ratings", { method: "POST", body: JSON.stringify({ listingPublicId: item.publicId, stars }) });
                    toast.success("Thanks — ratings stay attached to the alias, not an email.");
                    queryClient.invalidateQueries({ queryKey: ["rating", publicId] });
                  } finally {
                    setSubmittingRating(false);
                  }
                }}
              >
                Submit rating
              </Button>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogTitle>Report listing</DialogTitle>
          <DialogDescription>Reports go to community moderators. Aliases stay private.</DialogDescription>
          <div className="mt-4 space-y-3">
            <Select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason">
              {REPORT_REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ").toLowerCase()}</option>)}
            </Select>
            <Textarea placeholder="Optional details" value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={submitReport} loading={submittingReport}>Report listing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={takedownOpen} onOpenChange={setTakedownOpen}>
        <DialogContent>
          <DialogTitle>Take down this listing</DialogTitle>
          <DialogDescription>
            The listing will be removed from the marketplace immediately. The seller will be emailed the reason below and can see it in &quot;My listings&quot;.
          </DialogDescription>
          <Textarea
            className="mt-4"
            placeholder="Why is this listing being taken down? (required)"
            value={takedownReasonInput}
            onChange={(e) => setTakedownReasonInput(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTakedownOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={submitTakedown} loading={submittingTakedown} disabled={!takedownReasonInput.trim()}>
              Take down listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
