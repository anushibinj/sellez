"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { api } from "@/lib/api";
import { ChatMessage, REPORT_REASONS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, Input } from "@/components/ui/field";
import { toast } from "sonner";

export default function ChatThreadPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const bottom = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: () => api<ChatMessage[]>(`/chats/${id}/messages`),
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
    const client = new Client({
      brokerURL: url,
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
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const file = (document.getElementById("chat-image") as HTMLInputElement).files?.[0];
    await send.mutateAsync({ body: text, file });
    (document.getElementById("chat-image") as HTMLInputElement).value = "";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl">Private thread</h1>
      <p className="text-sm text-[var(--muted)]">You appear as Seller or Interested Buyer. Emails and names are never shown.</p>
      <Card className="h-[60vh] space-y-3 overflow-y-auto">
        {(messages.data ?? []).map((msg) => (
          <div key={msg.id} className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.mine ? "ml-auto bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]" : "bg-black/5 dark:bg-white/5"}`}>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{msg.system ? "System" : msg.roleLabel === "SELLER" ? "Seller" : "Interested Buyer"}</p>
            {msg.body && <p>{msg.body}</p>}
            {msg.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={msg.imageUrl} alt="" className="mt-2 max-h-48 rounded-xl" />
            )}
          </div>
        ))}
        <div ref={bottom} />
      </Card>
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" aria-label="Message" />
        <Input id="chat-image" type="file" accept="image/*" className="sm:max-w-48" />
        <Button type="submit">Send</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {REPORT_REASONS.map((reason) => (
          <Button key={reason} size="sm" variant="outline" onClick={async () => {
            await api("/reports", { method: "POST", body: JSON.stringify({ reason, chatId: id }) });
            toast.success("User reported. Moderators will review the case.");
          }}>Report {reason.toLowerCase()}</Button>
        ))}
      </div>
    </div>
  );
}
