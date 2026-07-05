"use client";
/*
 * AppShell — the responsive frame shared by every portal.
 * Desktop: fixed sidebar with nav + role switcher. Mobile: top bar with a
 * slide-in drawer. Redirects to the login page if no demo user is selected.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { navByRole, roleLabel } from "./navConfig";
import { RoleSwitcher } from "./RoleSwitcher";
import { Logo } from "@/components/ui/Logo";
import type { Role } from "@/types";

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { currentUser, loginAs, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // If no user yet (e.g. deep-link / refresh), auto-log in as the demo user for
  // this section so the preview is always usable. Real auth would redirect to
  // /login instead.
  useEffect(() => {
    if (!currentUser) loginAs(role);
  }, [currentUser, role, loginAs]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const nav = navByRole[role];

  const isActive = (href: string) =>
    href === `/${role}` ? pathname === href : pathname.startsWith(href);

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
            isActive(item.href)
              ? "bg-forest-700 text-cream shadow-soft"
              : "text-charcoal-soft hover:bg-forest-50 hover:text-forest-800"
          }`}
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-sand bg-white/80 backdrop-blur lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Logo size={40} withWordmark />
        </div>
        <NavLinks />
        <div className="space-y-2 border-t border-sand p-3">
          <RoleSwitcher />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-charcoal-soft hover:bg-clay-400/10 hover:text-clay-600"
          >
            <span>↩</span> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo size={34} withWordmark />
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-2xl bg-forest-50 text-forest-800"
        >
          ☰
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="rise-in absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-hero">
            <div className="flex items-center justify-between px-5 py-4">
              <Logo size={36} withWordmark />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full text-charcoal-soft hover:bg-charcoal/8"
              >
                ✕
              </button>
            </div>
            <NavLinks />
            <div className="space-y-2 border-t border-sand p-3">
              <RoleSwitcher />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-charcoal-soft hover:bg-clay-400/10"
              >
                <span>↩</span> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <div className="rise-in">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
      {roleLabel[role]} view
    </span>
  );
}
