"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Flag,
  MapPin,
  Trophy,
  Users,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { OnlineStatus } from "@/components/layout/online-status";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/play", label: "Play", icon: Flag },
  { href: "/courses", label: "Courses", icon: MapPin },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const authPaths = ["/login", "/register"];

const NavLink = React.memo(({ item, isActive: active }: { item: typeof navItems[0], isActive: boolean }) => (
  <Link
    href={item.href}
    prefetch={true}
    className={cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <item.icon className="h-5 w-5" />
    {item.label}
  </Link>
));

NavLink.displayName = "NavLink";

const MobileNavLink = React.memo(({ item, isActive: active }: { item: typeof navItems[0], isActive: boolean }) => (
  <Link
    href={item.href}
    prefetch={true}
    className={cn(
      "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
      active ? "text-primary" : "text-muted-foreground"
    )}
  >
    <item.icon className="h-5 w-5" />
    {item.label}
  </Link>
));

MobileNavLink.displayName = "MobileNavLink";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Auth pages render without navigation shell
  if (authPaths.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <Flag className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">GolfApp</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(pathname, item.href, item.exact)} />
          ))}
        </nav>
        <div className="border-t px-6 py-4">
          <OnlineStatus />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            <span className="font-bold">GolfApp</span>
          </Link>
          <OnlineStatus />
        </header>

        {/* Page content (padded at bottom on mobile for the tab bar) */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card md:hidden">
          {navItems.map((item) => (
            <MobileNavLink key={item.href} item={item} isActive={isActive(pathname, item.href, item.exact)} />
          ))}
        </nav>
      </div>
    </div>
  );
}
