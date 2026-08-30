"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Input, Skeleton } from "@/components/ui/field";

type Member = { id: string; alias: string; avatarColor: string; role: string; ratingAvg: number };

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const members = useQuery({ queryKey: ["admin-users"], queryFn: () => api<Member[]>("/admin/users") });
  if (members.isLoading) return <Skeleton className="h-48" />;
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">Members</h1>
      <p className="text-[var(--muted)]">Emails are never shown to admins.</p>
      {(members.data ?? []).map((m) => (
        <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: m.avatarColor }} />
            <div>
              <p>{m.alias}</p>
              <p className="text-sm text-[var(--muted)]">{m.role} · ★ {Number(m.ratingAvg).toFixed(1)}</p>
            </div>
          </div>
          <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            await api(`/admin/users/${m.id}/ban`, { method: "POST", body: JSON.stringify({ type: data.get("type"), days: Number(data.get("days")), reason: data.get("reason") }) });
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          }}>
            <select name="type" className="h-11 rounded-2xl border border-[var(--border)] bg-transparent px-3">
              <option value="POST">Post listings</option>
              <option value="CHAT">Chat</option>
              <option value="BOTH">Both</option>
            </select>
            <Input name="days" type="number" min={1} max={10} defaultValue={3} className="w-20" />
            <Input name="reason" placeholder="Reason" required />
            <Button variant="danger">Ban</Button>
          </form>
        </Card>
      ))}
    </div>
  );
}
