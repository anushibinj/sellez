"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban as BanIcon, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select, Skeleton, Textarea, Label } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";

type Member = { id: string; alias: string; avatarColor: string; role: string; ratingAvg: number };

function BanDialog({ member, onOpenChange, onDone }: { member: Member | null; onOpenChange: (open: boolean) => void; onDone: () => void }) {
  const [type, setType] = useState("POST");
  const [days, setDays] = useState("3");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Restrict {member?.alias}</DialogTitle>
        <DialogDescription>They will be notified with the reason you give below.</DialogDescription>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ban-type">Restriction</Label>
              <Select id="ban-type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="POST">Posting</option>
                <option value="CHAT">Chat</option>
                <option value="BOTH">Both</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="ban-days">Days</Label>
              <Input id="ban-days" type="number" min={1} max={10} value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="ban-reason">Reason</Label>
            <Textarea id="ban-reason" placeholder="Why is this member being restricted?" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            loading={loading}
            onClick={async () => {
              if (!member) return;
              setLoading(true);
              try {
                await api(`/admin/users/${member.id}/ban`, { method: "POST", body: JSON.stringify({ type, days: Number(days), reason }) });
                toast.success(`${member.alias} restricted.`);
                onDone();
                onOpenChange(false);
              } finally {
                setLoading(false);
              }
            }}
          >
            <BanIcon className="size-4" /> Restrict member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const members = useQuery({ queryKey: ["admin-users"], queryFn: () => api<Member[]>("/admin/users") });
  const [banning, setBanning] = useState<Member | null>(null);

  if (members.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  const items = members.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Members" description="Emails are never shown to admins." />
      {items.length === 0 ? (
        <EmptyState icon={Users} title="No members yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Member</TH>
              <TH>Role</TH>
              <TH>Rating</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {items.map((m) => (
              <TR key={m.id}>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <Avatar color={m.avatarColor} alias={m.alias} />
                    <span className="font-medium">{m.alias}</span>
                  </div>
                </TD>
                <TD><RoleBadge role={m.role} /></TD>
                <TD className="text-[var(--muted-foreground)]">★ {Number(m.ratingAvg).toFixed(1)}</TD>
                <TD className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setBanning(m)}>
                    <BanIcon className="size-3.5" /> Restrict
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <BanDialog
        member={banning}
        onOpenChange={(open) => !open && setBanning(null)}
        onDone={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
      />
    </div>
  );
}
