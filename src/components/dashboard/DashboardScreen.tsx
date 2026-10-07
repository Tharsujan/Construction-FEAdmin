"use client";

import Link from "next/link";
import { EmptyState, LoadState, PageHeading } from "@/components/ui";
import { formatQty } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { Stats } from "@/lib/types";

const CARDS = [
  {
    key: "openCementOrders",
    label: "Open cement orders",
    detail: "Everything except delivered and cancelled.",
    href: "/cement/orders",
  },
  {
    key: "activeProjects",
    label: "Active projects",
    detail: "Sites marked in progress.",
    href: "/projects?status=InProgress",
  },
  {
    key: "workersOnSite",
    label: "Workers on site",
    detail: "Assignments that include today.",
    href: "/workers",
  },
  {
    key: "equipmentOutOnRent",
    label: "Equipment on rent",
    detail: "Machines currently rented.",
    href: "/equipment?status=Rented",
  },
] as const;

export function DashboardScreen() {
  const stats = useResource<Stats>("/api/admin/stats");

  return (
    <div>
      <PageHeading
        kicker="Today"
        title="Yard office"
        lede="Open cement orders, sites in progress, crew on site today, and machines out on rent."
      />
      <div className="mt-6">
        <LoadState
          loading={stats.loading}
          error={stats.error}
          ready={stats.data !== null}
          onRetry={stats.reload}
          label="Loading the yard figures…"
        >
          {stats.data ? (
            <>
              <div className="grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
                {CARDS.map((card) => (
                  <Link
                    key={card.key}
                    href={card.href}
                    className="border border-line bg-card p-4 transition-colors hover:border-ink sm:p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{card.label}</p>
                    <p className="mt-3 font-display text-5xl leading-none">{stats.data?.[card.key]}</p>
                    <p className="mt-3 text-sm text-muted">{card.detail}</p>
                  </Link>
                ))}
              </div>
              <section className="mt-8">
                <h2 className="font-display text-3xl">Low stock</h2>
                <p className="mt-1 text-sm text-muted">Active products with 10 or fewer on hand.</p>
                {stats.data.lowStockProducts.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState title="Stock is clear" body="No active product is at or below 10." />
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-line border border-line bg-card">
                    {stats.data.lowStockProducts.map((product) => (
                      <li key={product.id}>
                        <Link href="/cement/products" className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-sand/50">
                          <span className="font-semibold">{product.name}</span>
                          <span className="text-sm font-semibold text-danger">{formatQty(product.stockQuantity)} on hand</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </LoadState>
      </div>
    </div>
  );
}
