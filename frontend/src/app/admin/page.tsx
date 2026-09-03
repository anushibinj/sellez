"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, DollarSign, Flag, MessageSquareWarning, ShieldOff } from "lucide-react";
import { api } from "@/lib/api";
import { Card, Skeleton } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

type Dashboard = {
  activeListings: number;
  pendingReview: number;
  soldToday: number;
  openReports: number;
  bannedUsers: number;
  pendingListingAppeals: number;
};

export default function AdminHome() {
  const dash = useQuery({ queryKey: ["admin-dash"], queryFn: () => api<Dashboard>("/admin/dashboard") });
  if (dash.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }
  if (dash.isError) return <EmptyState title="Admin access required" description="You need community admin access to view this page." />;
  const d = dash.data!;
  const tiles = [
    { label: "Active listings", value: d.activeListings, href: "/admin/listings", icon: CheckCircle2 },
    { label: "Pending review", value: d.pendingReview, href: "/admin/listings", icon: Clock },
    { label: "Sold today", value: d.soldToday, href: "/admin/listings", icon: DollarSign },
    { label: "Reports", value: d.openReports, href: "/admin/reports", icon: Flag },
    { label: "Banned users", value: d.bannedUsers, href: "/admin/users", icon: ShieldOff },
    { label: "Listing appeals", value: d.pendingListingAppeals, href: "/admin/appeals", icon: MessageSquareWarning },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Community desk" description="Moderate listings, review reports, and manage members." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {tiles.map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href}>
            <Card className="space-y-2 transition-colors hover:border-[var(--border-strong)]">
              <Icon className="size-4 text-[var(--muted-foreground)]" />
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
