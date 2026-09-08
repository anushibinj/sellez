"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { ArrowLeft, Flag, Paperclip, Send } from "lucide-react";
import { api } from "@/lib/api";
import { WS_URL } from "@/lib/config";
import { ChatMessage, REPORT_REASONS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Input, Select, Skeleton, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ChatThreadPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const bottom = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: () => api<ChatMessage[]>(`/chats/${id}/messages`),
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe(`/topic/chats/${id}`, () => {
          queryClient.invalidateQueries({ queryKey: ["messages", id] });
        });
      },
    });
    client.activate();
    return () => { void client.deactivate(); };
  }, [id, queryClient]);

  const send = useMutation({
    mutationFn: async (payload: { body?: string; file?: File }) => {
      const body = new FormData();
      if (payload.body) body.append("body", payload.body);
      if (payload.file) body.append("image", payload.file);
      return api(`/chats/${id}/messages`, { method: "POST", body });
    },
    onSuccess: () => {
      setText("");
      setPendingFile(null);
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() && !pendingFile) return;
    await send.mutateAsync({ body: text, file: pendingFile ?? undefined });
  }

  async function submitReport() {
    setSubmittingReport(true);
    try {
      await api("/reports", { method: "POST", body: JSON.stringify({ reason: reportReason, details: reportDetails, chatId: id }) });
      toast.success("User reported. Moderators will review the case.");
      setReportDetails("");
      setReportOpen(false);
    } finally {
      setSubmittingReport(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col gap-3 md:h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/chats" className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:bg-[var(--surface-2)]">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-base font-semibold">Private thread</h1>
            <p className="text-xs text-[var(--muted-foreground)]">Emails and names are never shown</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)}>
          <Flag className="size-3.5" /> Report
        </Button>
      </div>

      <Card className="flex-1 space-y-3 overflow-y-auto">
        {messages.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-2/3" />
            <Skeleton className="ml-auto h-14 w-2/3" />
          </div>
        ) : (
          (messages.data ?? []).map((msg) => (
            <div key={msg.id} className={`max-w-[80%] rounded-[var(--radius-md)] px-4 py-2.5 ${msg.mine ? "ml-auto bg-[var(--accent-tint)]" : "bg-[var(--surface-2)]"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{msg.system ? "System" : msg.roleLabel === "SELLER" ? "Seller" : "Interested Buyer"}</p>
              {msg.body && <p className="mt-0.5 text-sm">{msg.body}</p>}
              {msg.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={msg.imageUrl} alt="" className="mt-2 max-h-48 rounded-[var(--radius-sm)]" />
              )}
            </div>
          ))
        )}
        <div ref={bottom} />
      </Card>

      {pendingFile && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
          <Paperclip className="size-3.5" /> {pendingFile.name}
          <button type="button" className="ml-auto font-medium text-[var(--danger)]" onClick={() => setPendingFile(null)}>Remove</button>
        </div>
      )}
      <form className="flex items-center gap-2" onSubmit={onSubmit}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach image"
          className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-2)]"
        >
          <Paperclip className="size-4" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)} />
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" aria-label="Message" className="flex-1" />
        <Button type="submit" size="icon" loading={send.isPending} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogTitle>Report this conversation</DialogTitle>
          <DialogDescription>Reports go to community moderators. Aliases stay private.</DialogDescription>
          <div className="mt-4 space-y-3">
            <Select value={reportReason} onChange={(e) => setReportReason(e.target.value)} aria-label="Reason">
              {REPORT_REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ").toLowerCase()}</option>)}
            </Select>
            <Textarea placeholder="Optional details" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={submitReport} loading={submittingReport}>Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
