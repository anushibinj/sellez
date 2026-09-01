"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { api } from "@/lib/api";
import { Card, Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

type Report = { id: string; reason: string; details: string; listingPublicId: string | null; createdAt: string };

export default function AdminReports() {
  const reports = useQuery({ queryKey: ["admin-reports"], queryFn: () => api<Report[]>("/admin/reports") });
  if (reports.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }
  const items = reports.data ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Open cases flagged by members of your community." />
      {items.length === 0 ? (
        <EmptyState icon={Flag} title="No open cases" description="Reports from members will appear here for review." />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="warning">{r.reason.replace(/_/g, " ").toLowerCase()}</Badge>
                <span className="text-xs text-[var(--muted-foreground)]">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              {r.details && <p className="text-sm text-[var(--foreground)]">{r.details}</p>}
              {r.listingPublicId && (
                <Link href={`/listing/${r.listingPublicId}`} className="text-xs font-medium text-[var(--accent)] hover:underline">
                  View listing →
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
