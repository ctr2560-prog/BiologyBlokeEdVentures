"use client";
/*
 * AppShell - the responsive frame shared by every portal.
 *
 * Auth guard: waits for the Supabase session check, then:
 *  - No session  → redirects to /login (or / for students)
 *  - Wrong role  → redirects to the user's own portal home
 *  - Admin       → can preview any portal (RoleSwitcher visible)
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { navByRole, roleHome } from "./navConfig";
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
  // Signing out intentionally goes to the home page; the guard below must not
  // race it back to the login screen when currentUser flips to null.
  const loggingOutRef = useRef(false);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.push(loggingOutRef.current || role === "student" ? "/" : "/login");
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

  const nav = navByRole[role];

  const isActive = (href: string) =>
    href === `/${role}` ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    loggingOutRef.current = true;
    logout();
    router.push("/");
  };

  const NavLinks = () => (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
            isActive(item.href)
              ? "bg-white/15 text-cream shadow-sm"
              : "text-forest-100/60 hover:bg-white/8 hover:text-cream"
          }`}
        >
          <item.Icon
            className={`h-4.5 w-4.5 shrink-0 transition-colors ${isActive(item.href) ? "text-gold-400" : ""}`}
            aria-hidden
            strokeWidth={isActive(item.href) ? 2 : 1.75}
          />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const BottomBar = () => (
    <div className="border-t border-white/10 p-3">
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-forest-100/50 transition-all hover:bg-white/8 hover:text-cream"
      >
        <LogOut className="h-4 w-4" aria-hidden /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop sidebar — dark forest */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-forest-950 lg:flex">
        <div className="flex justify-center px-6 py-7">
          <Logo size={48} variant="white" />
        </div>
        <NavLinks />
        <BottomBar />
      </aside>

      {/* Mobile top bar — dark so the white logo is legible */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-forest-950 px-4 py-3 lg:hidden">
        <Logo size={44} variant="white" />
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-cream"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* Mobile drawer — dark forest */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="rise-in absolute inset-y-0 left-0 flex w-72 flex-col bg-forest-950 shadow-hero">
            <div className="flex items-center justify-between px-5 py-4">
              <Logo size={48} variant="white" />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full text-forest-100/50 hover:bg-white/10 hover:text-cream"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <NavLinks />
            <BottomBar />
          </div>
        </div>
      )}

      {/* Main content — fade-in only: a transform here would trap the lesson
          feed's position:fixed overlay inside this column */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <div className="fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
