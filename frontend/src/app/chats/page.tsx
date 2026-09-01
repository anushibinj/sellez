"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageCircleOff, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { ChatSummary } from "@/lib/types";
import { Card, Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function ChatsPage() {
  const chats = useQuery({ queryKey: ["chats"], queryFn: () => api<ChatSummary[]>("/chats") });
  if (chats.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }
  const items = chats.data ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title="Chats" description="Identities stay hidden. You will only see Seller or Interested Buyer." />
      {items.length === 0 ? (
        <EmptyState icon={MessageCircleOff} title="No conversations yet" description="Message a seller from a listing to start a private, anonymous thread." />
      ) : (
        <div className="space-y-2">
          {items.map((chat) => (
            <Link key={chat.id} href={`/chats/${chat.id}`}>
              <Card className="flex items-center justify-between gap-3 py-3.5 transition-colors hover:border-[var(--border-strong)]">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{chat.counterpartLabel}</p>
                  <h2 className="truncate text-sm font-medium">{chat.listingTitle}</h2>
                </div>
                <ChevronRight className="size-4 shrink-0 text-[var(--muted-foreground)]" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
