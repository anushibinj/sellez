"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Input, Skeleton } from "@/components/ui/field";

type Appeal = { id: string; status: string; message: string; userAlias: string; evidenceUrl: string | null };

export default function SuperAppeals() {
  const queryClient = useQueryClient();
  const appeals = useQuery({ queryKey: ["appeals"], queryFn: () => api<Appeal[]>("/super/appeals") });
  if (appeals.isLoading) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">Ban appeals</h1>
      {(appeals.data ?? []).map((a) => (
        <Card key={a.id} className="space-y-3">
          <p className="text-sm text-[var(--muted)]">{a.status} · {a.userAlias}</p>
          <p>{a.message}</p>
          {a.evidenceUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.evidenceUrl} alt="Evidence" className="max-h-48 rounded-xl" />
          )}
          {a.status === "PENDING" && (
            <form className="flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              const note = new FormData(e.currentTarget).get("note") as string;
              const approve = (e.nativeEvent as SubmitEvent).submitter instanceof HTMLButtonElement
                && ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value === "approve";
              await api(`/super/appeals/${a.id}/resolve`, { method: "POST", body: JSON.stringify({ approve, note }) });
              queryClient.invalidateQueries({ queryKey: ["appeals"] });
            }}>
              <Input name="note" placeholder="Note" />
              <Button name="approve" value="approve">Approve</Button>
              <Button variant="danger" name="approve" value="deny">Deny</Button>
            </form>
          )}
        </Card>
      ))}
    </div>
  );
}
