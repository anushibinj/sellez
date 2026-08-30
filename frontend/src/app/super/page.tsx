"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, Skeleton } from "@/components/ui/field";

type Dash = { communities: number; users: number; listings: number; activeListings: number; pendingAppeals: number; revenue: number };

export default function SuperHome() {
  const dash = useQuery({ queryKey: ["super-dash"], queryFn: () => api<Dash>("/super/dashboard") });
  if (dash.isLoading) return <Skeleton className="h-40" />;
  if (dash.isError) return <Card>Super admin only.</Card>;
  const d = dash.data!;
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Platform pulse</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card><p className="text-sm text-[var(--muted)]">Communities</p><p className="serif text-4xl">{d.communities}</p></Card>
        <Card><p className="text-sm text-[var(--muted)]">Users</p><p className="serif text-4xl">{d.users}</p></Card>
        <Card><p className="text-sm text-[var(--muted)]">Listings</p><p className="serif text-4xl">{d.listings}</p></Card>
        <Card><p className="text-sm text-[var(--muted)]">Active</p><p className="serif text-4xl">{d.activeListings}</p></Card>
        <Card><p className="text-sm text-[var(--muted)]">Appeals</p><p className="serif text-4xl">{d.pendingAppeals}</p></Card>
        <Card><p className="text-sm text-[var(--muted)]">Revenue</p><p className="serif text-4xl">—</p><p className="text-sm text-[var(--muted)]">Future</p></Card>
      </div>
      <div className="flex gap-3">
        <Link className="underline" href="/super/communities">Communities</Link>
        <Link className="underline" href="/super/appeals">Appeals</Link>
        <Link className="underline" href="/super/audit">Audit log</Link>
      </div>
    </div>
  );
}
