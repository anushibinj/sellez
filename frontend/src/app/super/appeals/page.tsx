"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Input, Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

type Appeal = { id: string; status: string; message: string; userAlias: string; evidenceUrl: string | null };

export default function SuperAppeals() {
  const queryClient = useQueryClient();
  const appeals = useQuery({ queryKey: ["appeals"], queryFn: () => api<Appeal[]>("/super/appeals") });
  const [resolving, setResolving] = useState<string | null>(null);

  if (appeals.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }
  const items = appeals.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Ban appeals" />
      {items.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No appeals waiting" description="Restricted members can appeal from their account menu." />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{a.userAlias}</span>
                  <Badge tone={a.status === "PENDING" ? "warning" : a.status === "APPROVED" ? "success" : "danger"}>{a.status.toLowerCase()}</Badge>
                </div>
              </div>
              <p className="text-sm text-[var(--foreground)]">{a.message}</p>
              {a.evidenceUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.evidenceUrl} alt="Evidence" className="max-h-48 rounded-[var(--radius-sm)]" />
              )}
              {a.status === "PENDING" && (
                <form
                  className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const note = new FormData(e.currentTarget).get("note") as string;
                    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                    const approve = submitter?.value === "approve";
                    setResolving(a.id);
                    try {
                      await api(`/super/appeals/${a.id}/resolve`, { method: "POST", body: JSON.stringify({ approve, note }) });
                      toast.success(approve ? "Appeal approved." : "Appeal denied.");
                      queryClient.invalidateQueries({ queryKey: ["appeals"] });
                    } finally {
                      setResolving(null);
                    }
                  }}
                >
                  <Input name="note" placeholder="Note (optional)" className="min-w-0 flex-1" />
                  <Button name="approve" value="deny" variant="outline" loading={resolving === a.id}>Deny</Button>
                  <Button name="approve" value="approve" loading={resolving === a.id}>Approve</Button>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
