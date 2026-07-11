"use client";
/*
 * AppShell - the responsive frame shared by every portal.
 *
 * Auth guard: waits for the Supabase session check, then:
 *  - No session  → redirects to /login (or / for students)
 *  - Wrong role  → redirects to the user's own portal home
 *  - Admin       → can preview any portal (RoleSwitcher visible)
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { navByRole, roleHome } from "./navConfig";
import { RoleSwitcher } from "./RoleSwitcher";
import { Logo } from "@/components/ui/Logo";
import { Menu, X, LogOut, Loader } from "lucide-react";
import type { Role } from "@/types";

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { currentUser, authReady, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.push(role === "student" ? "/" : "/login");
      return;
    }
    // Admin may preview any portal. All other roles are confined to their own.
    if (currentUser.role !== "admin" && currentUser.role !== role) {
      router.push(roleHome[currentUser.role]);
    }
  }, [authReady, currentUser, role, router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // ── Loading / redirect suppression ───────────────────────────────────────
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader className="h-8 w-8 animate-spin text-forest-600" aria-hidden />
      </div>
    );
  }
  if (!currentUser) return null;
  if (currentUser.role !== "admin" && currentUser.role !== role) return null;

  const isAdmin = currentUser.role === "admin";
  const nav = navByRole[role];

  const isActive = (href: string) =>
    href === `/${role}` ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push(role === "student" ? "/" : "/login");
  };

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
          <item.Icon className="h-5 w-5 shrink-0" aria-hidden strokeWidth={1.75} />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const BottomBar = () => (
    <div className="space-y-2 border-t border-sand p-3">
      {isAdmin && <RoleSwitcher currentPortal={role} />}
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-charcoal-soft hover:bg-clay-400/10 hover:text-clay-600"
      >
        <LogOut className="h-4 w-4" aria-hidden /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-sand bg-white/80 backdrop-blur lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Logo size={40} withWordmark />
        </div>
        <NavLinks />
        <BottomBar />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo size={34} withWordmark />
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-2xl bg-forest-50 text-forest-800"
        >
          <Menu className="h-5 w-5" aria-hidden />
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
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <NavLinks />
            <BottomBar />
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
