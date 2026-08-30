"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChatSummary } from "@/lib/types";
import { Card, Skeleton } from "@/components/ui/field";

export default function ChatsPage() {
  const chats = useQuery({ queryKey: ["chats"], queryFn: () => api<ChatSummary[]>("/chats") });
  if (chats.isLoading) return <Skeleton className="h-48" />;
  const items = chats.data ?? [];
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">Anonymous chats</h1>
      <p className="text-[var(--muted)]">Identities stay hidden. You will only see Seller or Interested Buyer.</p>
      {items.length === 0 ? <Card className="py-16 text-center text-[var(--muted)]">No conversations yet.</Card> : items.map((chat) => (
        <Link key={chat.id} href={`/chats/${chat.id}`}>
          <Card className="mb-3">
            <p className="text-sm text-[var(--muted)]">{chat.counterpartLabel}</p>
            <h2 className="text-xl">{chat.listingTitle}</h2>
          </Card>
        </Link>
      ))}
    </div>
  );
}
