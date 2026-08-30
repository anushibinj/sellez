"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, Skeleton } from "@/components/ui/field";

type Report = { id: string; reason: string; details: string; listingPublicId: string | null; createdAt: string };

export default function AdminReports() {
  const reports = useQuery({ queryKey: ["admin-reports"], queryFn: () => api<Report[]>("/admin/reports") });
  if (reports.isLoading) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">Reports</h1>
      {(reports.data ?? []).length === 0 && <Card>No open cases.</Card>}
      {(reports.data ?? []).map((r) => (
        <Card key={r.id}>
          <p className="text-sm text-[var(--muted)]">{r.reason} · {r.listingPublicId}</p>
          <p>{r.details}</p>
        </Card>
      ))}
    </div>
  );
}
