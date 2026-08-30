"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, Skeleton } from "@/components/ui/field";

type Dashboard = { activeListings: number; pendingReview: number; soldToday: number; openReports: number; bannedUsers: number };

export default function AdminHome() {
  const dash = useQuery({ queryKey: ["admin-dash"], queryFn: () => api<Dashboard>("/admin/dashboard") });
  if (dash.isLoading) return <Skeleton className="h-40" />;
  if (dash.isError) return <Card>You need community admin access.</Card>;
  const d = dash.data!;
  const tiles = [
    ["Active listings", d.activeListings, "/admin/listings"],
    ["Pending review", d.pendingReview, "/admin/listings"],
    ["Sold today", d.soldToday, "/admin/listings"],
    ["Reports", d.openReports, "/admin/reports"],
    ["Banned users", d.bannedUsers, "/admin/users"],
  ] as const;
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Community desk</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map(([label, value, href]) => (
          <Link key={label} href={href}><Card><p className="text-sm text-[var(--muted)]">{label}</p><p className="serif text-4xl">{value}</p></Card></Link>
        ))}
      </div>
    </div>
  );
}
