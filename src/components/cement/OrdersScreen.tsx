"use client";

import Link from "next/link";
import { EmptyState, FilterBar, LoadState, PageHeading, Records, StatusBadge, buttonClass } from "@/components/ui";
import { formatDateTime, money } from "@/lib/format";
import { useQueryFilter } from "@/lib/use-query-filter";
import { useResource } from "@/lib/use-resource";
import type { CementOrder } from "@/lib/types";

const FILTERS = [
  { value: "", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "OutForDelivery", label: "Out for delivery" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
];

export function OrdersScreen() {
  const [status, setStatus] = useQueryFilter("status");
  const path = status ? `/api/admin/cement/orders?status=${encodeURIComponent(status)}` : "/api/admin/cement/orders";
  const orders = useResource<CementOrder[]>(path);

  return (
    <div>
      <PageHeading
        kicker="Cement"
        title="Orders"
        lede="Every customer order. Confirming takes stock. Cancelling after that puts the stock back."
      />
      <div className="mt-6 space-y-4">
        <FilterBar label="Order status" value={status} onChange={setStatus} options={FILTERS} />
        <LoadState loading={orders.loading} error={orders.error} ready={orders.data !== null} onRetry={orders.reload} label="Loading cement orders…">
          {orders.data && orders.data.length === 0 ? (
            <EmptyState title="No orders in this view" body="Customer orders will show here once they are placed." />
          ) : null}
          {orders.data && orders.data.length > 0 ? (
            <Records
              rows={orders.data}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "customer",
                  header: "Customer",
                  cell: (row) => (
                    <span>
                      <span className="block font-semibold">{row.clientName}</span>
                      <span className="text-sm text-muted">{formatDateTime(row.createdAt)}</span>
                    </span>
                  ),
                },
                { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
                { key: "payment", header: "Payment", cell: (row) => <StatusBadge status={row.paymentStatus} /> },
                { key: "total", header: "Total", cell: (row) => money(row.total) },
                { key: "project", header: "Site", cell: (row) => row.projectName ?? "Not linked" },
                {
                  key: "open",
                  header: "Open",
                  cell: (row) => (
                    <Link href={`/cement/orders/${row.id}`} className={buttonClass("quiet")}>
                      Open
                    </Link>
                  ),
                },
              ]}
            />
          ) : null}
        </LoadState>
      </div>
    </div>
  );
}
