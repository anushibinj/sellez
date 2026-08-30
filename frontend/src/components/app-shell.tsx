"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { getMe, logout } from "@/lib/api";
import { Button } from "./ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  const isPublic = pathname === "/" || pathname.startsWith("/login");

  useEffect(() => {
    if (me.isLoading) return;
    if (me.isError && !isPublic) router.replace("/login");
    if (me.data && !me.data.onboarded && pathname !== "/onboarding") router.replace("/onboarding");
  }, [me.isLoading, me.isError, me.data, isPublic, pathname, router]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href={me.data ? "/marketplace" : "/"} className="serif text-xl tracking-tight">
            SellEZ
          </Link>
          {me.data ? (
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              <Link className="rounded-full px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/marketplace">Browse</Link>
              <Link className="rounded-full px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/listings/mine">My listings</Link>
              <Link className="rounded-full px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/chats">Chats</Link>
              {(me.data.role === "COMMUNITY_ADMIN" || me.data.role === "SUPER_ADMIN") && (
                <Link className="rounded-full px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/admin">Admin</Link>
              )}
              {me.data.role === "SUPER_ADMIN" && (
                <Link className="rounded-full px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/super">Super</Link>
              )}
              <span className="hidden items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 sm:flex">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: me.data.avatarColor }} />
                {me.data.alias}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={async () => { await logout(); router.push("/"); }}>
                Log out
              </Button>
            </nav>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button asChild size="sm"><Link href="/login">Sign in</Link></Button>
            </div>
          )}
        </div>
      </header>
      {me.data?.ban && (
        <div className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--warn)_12%,transparent)] px-4 py-3 text-center text-sm">
          You are temporarily restricted until {me.data.ban.untilLabel}.{" "}
          <Link className="underline" href="/banned/appeal">Appeal ban</Link>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
