"use client";

import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Page = { content: { id: string; eventType: string; entityType: string; createdAt: string }[] };

export default function AuditPage() {
  const logs = useQuery({ queryKey: ["audit"], queryFn: () => api<Page>("/super/audit") });
  if (logs.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  const rows = logs.data?.content ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Audit trail" description="Identities are stored server-side only. This view shows event types, not emails." />
      {rows.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Event</TH>
              <TH>Entity</TH>
              <TH>When</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD><Badge tone="neutral">{row.eventType.replace(/_/g, " ").toLowerCase()}</Badge></TD>
                <TD className="text-[var(--muted-foreground)]">{row.entityType}</TD>
                <TD className="text-[var(--muted-foreground)]">{new Date(row.createdAt).toLocaleString()}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
