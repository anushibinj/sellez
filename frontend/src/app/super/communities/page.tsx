"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, ChevronDown, ShieldCheck, ShieldMinus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Community = { id: string; domain: string; displayName: string; members: number; activeListings: number };
type Member = { id: string; alias: string; role: string };

export default function SuperCommunities() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ["communities"], queryFn: () => api<Community[]>("/super/communities") });
  const [open, setOpen] = useState<string | null>(null);
  const members = useQuery({
    queryKey: ["community-members", open],
    queryFn: () => api<Member[]>(`/super/communities/${open}/members`),
    enabled: Boolean(open),
  });

  if (list.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }
  const items = list.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Communities" />
      {items.length === 0 ? (
        <EmptyState icon={Building2} title="No communities yet" />
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const expanded = open === c.id;
            return (
              <Card key={c.id} className="p-0">
                <button
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  onClick={() => setOpen(expanded ? null : c.id)}
                  aria-expanded={expanded}
                >
                  <div>
                    <h2 className="text-sm font-semibold">{c.displayName}</h2>
                    <p className="text-xs text-[var(--muted-foreground)]">{c.domain} · {c.members} members · {c.activeListings} live</p>
                  </div>
                  <ChevronDown className={cn("size-4 shrink-0 text-[var(--muted-foreground)] transition-transform", expanded && "rotate-180")} />
                </button>
                {expanded && (
                  <div className="space-y-1 border-t border-[var(--border)] p-3">
                    {members.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      (members.data ?? []).map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-2 hover:bg-[var(--surface-2)]">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{m.alias}</span>
                            <RoleBadge role={m.role} />
                          </div>
                          {m.role === "COMMUNITY_ADMIN" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await api(`/super/communities/${c.id}/admins/${m.id}`, { method: "DELETE" });
                                toast.success(`${m.alias} is no longer an admin.`);
                                queryClient.invalidateQueries({ queryKey: ["community-members", open] });
                              }}
                            >
                              <ShieldMinus className="size-3.5" /> Remove admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={async () => {
                                await api(`/super/communities/${c.id}/admins/${m.id}`, { method: "POST" });
                                toast.success(`${m.alias} promoted to admin.`);
                                queryClient.invalidateQueries({ queryKey: ["community-members", open] });
                              }}
                            >
                              <ShieldCheck className="size-3.5" /> Promote
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
