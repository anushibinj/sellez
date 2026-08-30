"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, Skeleton } from "@/components/ui/field";

type Page = { content: { id: string; eventType: string; entityType: string; createdAt: string }[] };

export default function AuditPage() {
  const logs = useQuery({ queryKey: ["audit"], queryFn: () => api<Page>("/super/audit") });
  if (logs.isLoading) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">Audit trail</h1>
      <p className="text-sm text-[var(--muted)]">Identities are stored server-side only. This view shows event types, not emails.</p>
      {(logs.data?.content ?? []).map((row) => (
        <Card key={row.id} className="flex justify-between gap-4">
          <span>{row.eventType}</span>
          <span className="text-sm text-[var(--muted)]">{row.entityType} · {new Date(row.createdAt).toLocaleString()}</span>
        </Card>
      ))}
    </div>
  );
}
