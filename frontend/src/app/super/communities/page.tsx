"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/field";

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
  if (list.isLoading) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">Communities</h1>
      {(list.data ?? []).map((c) => (
        <Card key={c.id} className="space-y-3">
          <button className="text-left" onClick={() => setOpen(c.id)}>
            <h2 className="text-2xl">{c.displayName}</h2>
            <p className="text-sm text-[var(--muted)]">{c.domain} · {c.members} members · {c.activeListings} live</p>
          </button>
          {open === c.id && (members.data ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2">
              <span>{m.alias} · {m.role}</span>
              {m.role === "COMMUNITY_ADMIN" ? (
                <Button variant="outline" size="sm" onClick={async () => { await api(`/super/communities/${c.id}/admins/${m.id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: ["community-members", open] }); }}>Remove admin</Button>
              ) : (
                <Button size="sm" onClick={async () => { await api(`/super/communities/${c.id}/admins/${m.id}`, { method: "POST" }); queryClient.invalidateQueries({ queryKey: ["community-members", open] }); }}>Promote</Button>
              )}
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
