"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Moon, Store, MessageCircle, Package, PlusCircle, Shield, ShieldCheck, Sun, User, LogOut, AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { getMe, logout } from "@/lib/api";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { Dialog, SheetContent, DialogTitle } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

const NAV_LINKS = [
  { href: "/marketplace", label: "Browse", icon: Store },
  { href: "/listings/mine", label: "My listings", icon: Package },
  { href: "/chats", label: "Chats", icon: MessageCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  const isPublic = pathname === "/" || pathname.startsWith("/login");
  const authed = Boolean(me.data && me.data.onboarded && !me.isError);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomNavRef = useRef<HTMLElement>(null);
  // Measure the bottom nav's real rendered height instead of guessing a fixed padding value —
  // a hardcoded guess can fall short at unusual zoom levels / text-wrap widths and let the
  // fixed nav cover the last bit of page content. Reports 0 when the nav is `md:hidden`.
  const [bottomNavHeight, setBottomNavHeight] = useState(0);

  useEffect(() => {
    if (me.isLoading) return;
    if (me.isError && !isPublic) router.replace("/login");
    if (me.data && !me.data.onboarded && pathname !== "/onboarding") router.replace("/onboarding");
  }, [me.isLoading, me.isError, me.data, isPublic, pathname, router]);

  useEffect(() => {
    const el = bottomNavRef.current;
    if (!el) {
      setBottomNavHeight(0);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      setBottomNavHeight(entries[0]?.contentRect.height ?? 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [authed]);

  async function handleLogout() {
    await logout();
    queryClient.clear();
    router.push("/");
  }

  const isAdmin = me.data?.role === "COMMUNITY_ADMIN" || me.data?.role === "SUPER_ADMIN";
  const isSuperAdmin = me.data?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href={me.data ? "/marketplace" : "/"} className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <span className="flex size-6 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">S</span>
            SellEZ
          </Link>

          {authed ? (
            <>
              <nav className="hidden items-center gap-1 text-sm md:flex">
                {NAV_LINKS.map((link) => {
                  const active = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "rounded-[var(--radius-sm)] px-3 py-1.5 font-medium transition-colors",
                        active ? "bg-[var(--accent-tint)] text-[var(--accent)]" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={cn(
                      "rounded-[var(--radius-sm)] px-3 py-1.5 font-medium transition-colors",
                      pathname.startsWith("/admin") ? "bg-[var(--accent-tint)] text-[var(--accent)]" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                    )}
                  >
                    Admin
                  </Link>
                )}
                {isSuperAdmin && (
                  <Link
                    href="/super"
                    className={cn(
                      "rounded-[var(--radius-sm)] px-3 py-1.5 font-medium transition-colors",
                      pathname.startsWith("/super") ? "bg-[var(--accent-tint)] text-[var(--accent)]" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                    )}
                  >
                    Super
                  </Link>
                )}
              </nav>

              <div className="flex items-center gap-1.5">
                <Button asChild size="sm" className="hidden md:inline-flex">
                  <Link href="/listings/new">
                    <PlusCircle className="size-4" /> Sell
                  </Link>
                </Button>
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                      <Avatar color={me.data!.avatarColor} alias={me.data!.alias} />
                      <span className="hidden text-sm font-medium sm:inline">{me.data!.alias}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>{me.data!.community.displayName}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {me.data?.ban && (
                      <DropdownMenuItem asChild>
                        <Link href="/banned/appeal"><AlertTriangle className="size-4" /> Appeal restriction</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout} destructive>
                      <LogOut className="size-4" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild size="sm"><Link href="/login">Sign in</Link></Button>
            </div>
          )}
        </div>
      </header>

      {me.data?.ban && (
        <div className="border-b border-[var(--border)] bg-[var(--warning-tint)] px-4 py-2.5 text-center text-sm text-[var(--warning)]">
          You are temporarily restricted until {me.data.ban.untilLabel}.{" "}
          <Link className="font-medium underline underline-offset-2" href="/banned/appeal">Appeal ban</Link>
        </div>
      )}

      <main
        className={cn("mx-auto max-w-6xl px-4 py-6 sm:py-8")}
        // Bottom padding always covers the fixed bottom nav's real measured height (plus a small
        // buffer), never a hardcoded guess — see the ResizeObserver above. On desktop, where the
        // nav is `md:hidden`, the observed height is 0 and this falls back to a flat 2rem.
        style={authed ? { paddingBottom: `max(2rem, ${bottomNavHeight + 16}px)` } : undefined}
      >
        {children}
      </main>

      {authed && (
        <nav
          ref={bottomNavRef}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <div className="mx-auto flex max-w-6xl items-stretch justify-around">
            {[
              { href: "/marketplace", label: "Browse", icon: Store },
              { href: "/listings/new", label: "Sell", icon: PlusCircle },
              { href: "/chats", label: "Chats", icon: MessageCircle },
            ].map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => setMenuOpen(true)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                menuOpen || pathname.startsWith("/admin") || pathname.startsWith("/super") ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"
              )}
            >
              <User className="size-5" />
              Account
            </button>
          </div>
        </nav>
      )}

      {authed && (
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="bottom">
            <DialogTitle className="sr-only">Account menu</DialogTitle>
            <div className="flex items-center gap-3 pb-4">
              <Avatar color={me.data!.avatarColor} alias={me.data!.alias} className="size-10 text-sm" />
              <div>
                <p className="text-sm font-semibold">{me.data!.alias}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{me.data!.community.displayName}</p>
              </div>
            </div>
            <div className="space-y-1 border-t border-[var(--border)] pt-3">
              <Link href="/listings/mine" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-2)]">
                <Package className="size-4" /> My listings
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-2)]">
                  <ShieldCheck className="size-4" /> Admin
                </Link>
              )}
              {isSuperAdmin && (
                <Link href="/super" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-2)]">
                  <Shield className="size-4" /> Super admin
                </Link>
              )}
              {me.data?.ban && (
                <Link href="/banned/appeal" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--warning)] hover:bg-[var(--warning-tint)]">
                  <AlertTriangle className="size-4" /> Appeal restriction
                </Link>
              )}
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-tint)]">
                <LogOut className="size-4" /> Log out
              </button>
            </div>
          </SheetContent>
        </Dialog>
      )}
    </div>
  );
}
