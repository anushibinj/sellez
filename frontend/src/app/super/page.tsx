"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, ListChecks, ScrollText, ShieldAlert, Sparkles, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card, Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

type Dash = { communities: number; users: number; listings: number; activeListings: number; pendingAppeals: number; revenue: number };

const LINKS = [
  { href: "/super/communities", label: "Communities", icon: Building2 },
  { href: "/super/appeals", label: "Appeals", icon: ShieldAlert },
  { href: "/super/audit", label: "Audit log", icon: ScrollText },
];

export default function SuperHome() {
  const dash = useQuery({ queryKey: ["super-dash"], queryFn: () => api<Dash>("/super/dashboard") });
  if (dash.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }
  if (dash.isError) return <EmptyState title="Super admin access required" />;
  const d = dash.data!;
  const tiles = [
    { label: "Communities", value: d.communities, icon: Building2 },
    { label: "Users", value: d.users, icon: Users },
    { label: "Listings", value: d.listings, icon: ListChecks },
    { label: "Active", value: d.activeListings, icon: Sparkles },
    { label: "Appeals", value: d.pendingAppeals, icon: ShieldAlert },
    { label: "Revenue", value: "—", icon: ScrollText, note: "Future" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform" title="Platform pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, note }) => (
          <Card key={label} className="space-y-2">
            <Icon className="size-4 text-[var(--muted-foreground)]" />
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{label}{note ? ` · ${note}` : ""}</p>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]">
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
