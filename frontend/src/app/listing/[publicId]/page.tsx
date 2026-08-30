"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ListingDetail, REPORT_REASONS } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Skeleton, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PrivacyNote } from "@/components/privacy-note";

export default function ListingDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listing = useQuery({ queryKey: ["listing", publicId], queryFn: () => api<ListingDetail>(`/listings/${publicId}`) });
  const rating = useQuery({
    queryKey: ["rating", publicId],
    queryFn: () => api<{ stars: number } | null>(`/ratings?listingPublicId=${publicId}`),
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [details, setDetails] = useState("");
  const [stars, setStars] = useState(5);

  if (listing.isLoading) return <Skeleton className="h-96" />;
  if (listing.isError || !listing.data) return <Card>This listing is unavailable in your community.</Card>;
  const item = listing.data;

  async function submitReport() {
    await api("/reports", { method: "POST", body: JSON.stringify({ reason, details, listingPublicId: item.publicId }) });
    toast.success("Report sent to community moderators.");
    setDetails("");
    setReason("SPAM");
    setReportOpen(false);
  }

  return (
    <>
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {item.images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" loading="lazy" className="aspect-square w-full rounded-[24px] object-cover" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{item.communityName} · share /listing/{item.publicId}</p>
        <h1 className="text-4xl">{item.title}</h1>
        <p className="text-2xl">{formatPrice(item.price, item.currency)}</p>
        <p className="whitespace-pre-wrap text-[var(--muted)]">{item.description}</p>
        <p>{item.category} · {item.condition}{item.location ? ` · ${item.location}` : ""}</p>
        <p>Seller alias {item.seller.alias} · ★ {Number(item.seller.ratingAvg).toFixed(1)} ({item.seller.ratingCount})</p>
        <PrivacyNote>Chats are anonymous. You will never see this person&apos;s email or name.</PrivacyNote>
        <div className="flex flex-wrap gap-2">
          {!item.owner && item.status === "ACTIVE" && (
            <Button onClick={async () => {
              const chat = await api<{ id: string }>("/chats/start", { method: "POST", body: JSON.stringify({ listingPublicId: item.publicId }) });
              router.push(`/chats/${chat.id}`);
            }}>Message seller</Button>
          )}
          {!item.owner && (
            <Button variant="outline" onClick={() => setReportOpen(true)}>Report</Button>
          )}
          {item.owner && item.status === "ACTIVE" && (
            <Button onClick={async () => {
              await api(`/listings/${item.publicId}/sold`, { method: "POST" });
              queryClient.invalidateQueries({ queryKey: ["listing", publicId] });
            }}>Mark sold</Button>
          )}
          {item.owner && <Button variant="outline" onClick={() => router.push(`/listings/${item.publicId}/edit`)}>Edit</Button>}
        </div>
        {!item.owner && item.status === "SOLD" && !rating.data && (
          <Card>
            <h2 className="text-xl">Rate this seller</h2>
            <input type="range" min={1} max={5} value={stars} onChange={(e) => setStars(Number(e.target.value))} className="mt-3 w-full" />
            <p>{stars} stars</p>
            <Button className="mt-3" onClick={async () => {
              await api("/ratings", { method: "POST", body: JSON.stringify({ listingPublicId: item.publicId, stars }) });
              toast.success("Thanks — ratings stay attached to the alias, not an email.");
              queryClient.invalidateQueries({ queryKey: ["rating", publicId] });
            }}>Submit rating</Button>
          </Card>
        )}
      </div>
    </div>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogTitle>Report listing</DialogTitle>
          <DialogDescription>Reports go to community moderators. Aliases stay private.</DialogDescription>
          <select className="mt-3 h-11 w-full rounded-2xl border border-[var(--border)] bg-transparent px-3" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <Textarea className="mt-3" placeholder="Optional details" value={details} onChange={(e) => setDetails(e.target.value)} />
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={submitReport}>Report listing</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
