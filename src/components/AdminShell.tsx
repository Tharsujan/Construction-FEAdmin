"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { DENIED_KEY } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { buttonClass } from "./ui";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/units", label: "Units" },
  { href: "/cement/products", label: "Cement products" },
  { href: "/cement/orders", label: "Cement orders" },
  { href: "/equipment", label: "Equipment" },
  { href: "/rentals", label: "Rentals" },
  { href: "/projects", label: "Projects" },
  { href: "/workers", label: "Workers" },
];

function subscribeHydration() {
  return () => {};
}

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "A";
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-hoarding text-paper">
      <div className="hazard-bar" />
      <div className="px-5 pb-4 pt-5">
        <p className="font-display text-3xl tracking-wide">SITEWORKS</p>
        <p className="text-sm text-paper/70">Yard office</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Yard office">
        {NAV.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center border-l-2 px-3 text-sm font-semibold ${
                active ? "border-clay bg-paper/10 text-paper" : "border-transparent text-paper/75 hover:bg-paper/5 hover:text-paper"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold">{user?.name}</p>
        <p className="truncate text-sm text-paper/70">{user?.email}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 min-h-11 w-full border border-paper/30 px-3 text-sm font-semibold hover:bg-paper hover:text-hoarding"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const { user, ready, profileError, refresh } = useAuth();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const current = NAV.find((item) => isActive(item.href, pathname));

  useEffect(() => {
    if (!hydrated || !ready || user || profileError) return;
    const denied = sessionStorage.getItem(DENIED_KEY);
    if (denied) sessionStorage.removeItem(DENIED_KEY);
    const params = new URLSearchParams();
    params.set("next", `${window.location.pathname}${window.location.search}`);
    if (denied) params.set("reason", "staff");
    router.replace(`/login?${params.toString()}`);
  }, [hydrated, ready, user, profileError, router]);

  if (!user) {
    return (
      <>
        {!ready ? (
          <p className="grid min-h-dvh place-items-center px-6 text-muted" role="status">
            Checking your staff session…
          </p>
        ) : profileError ? (
          <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Yard office</p>
            <h1 className="mt-2 font-display text-4xl">The session could not be confirmed.</h1>
            <p className="mt-4 text-danger">{profileError}</p>
            <button type="button" onClick={() => void refresh()} className={`${buttonClass()} mt-6 w-fit`}>
              Try again
            </button>
          </div>
        ) : (
          <p className="grid min-h-dvh place-items-center px-6 text-muted" role="status">
            Opening sign in…
          </p>
        )}
        <div hidden>{children}</div>
      </>
    );
  }

  return (
    <div className="min-h-dvh bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(100%,18rem)]">
              <Sidebar onNavigate={() => setMenuPath(null)} />
          </div>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="inline-flex min-h-11 items-center border border-line bg-card px-3 text-sm font-semibold lg:hidden"
            aria-expanded={menuOpen}
            onClick={() => setMenuPath(menuOpen ? null : pathname)}
          >
            Menu
          </button>
          <p className="truncate font-display text-2xl tracking-wide">{current?.label ?? "Yard office"}</p>
          <span className="ml-auto grid size-9 place-items-center bg-hoarding text-xs font-semibold text-paper lg:hidden">
            {initials(user.name)}
          </span>
        </header>
        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
