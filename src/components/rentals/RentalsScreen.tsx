"use client";

import Link from "next/link";
import { EmptyState, FilterBar, LoadState, PageHeading, Records, StatusBadge, buttonClass } from "@/components/ui";
import { formatDate, money } from "@/lib/format";
import { useQueryFilter } from "@/lib/use-query-filter";
import { useResource } from "@/lib/use-resource";
import type { Rental } from "@/lib/types";

const FILTERS = [
  { value: "", label: "All" },
  { value: "Requested", label: "Requested" },
  { value: "Active", label: "Active" },
  { value: "Returned", label: "Returned" },
  { value: "Cancelled", label: "Cancelled" },
];

export function RentalsScreen() {
  const [status, setStatus] = useQueryFilter("status");
  const path = status ? `/api/admin/rentals?status=${encodeURIComponent(status)}` : "/api/admin/rentals";
  const rentals = useResource<Rental[]>(path);

  return (
    <div>
      <PageHeading
        kicker="Yard"
        title="Rentals"
        lede="Approve a request when the machine is available. Returning it frees the machine and sets the charge."
      />
      <div className="mt-6 space-y-4">
        <FilterBar label="Rental status" value={status} onChange={setStatus} options={FILTERS} />
        <LoadState loading={rentals.loading} error={rentals.error} ready={rentals.data !== null} onRetry={rentals.reload} label="Loading rentals…">
          {rentals.data && rentals.data.length === 0 ? (
            <EmptyState title="No rentals in this view" body="Customer hire requests will show here." />
          ) : null}
          {rentals.data && rentals.data.length > 0 ? (
            <Records
              rows={rentals.data}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "customer",
                  header: "Customer",
                  cell: (row) => (
                    <span>
                      <span className="block font-semibold">{row.clientName}</span>
                      <span className="text-sm text-muted">{row.equipmentName}</span>
                    </span>
                  ),
                },
                { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
                { key: "payment", header: "Payment", cell: (row) => <StatusBadge status={row.paymentStatus} /> },
                {
                  key: "dates",
                  header: "Dates",
                  cell: (row) => `${formatDate(row.startDate)} – ${formatDate(row.expectedReturn)}`,
                },
                { key: "total", header: "Total", cell: (row) => money(row.total) },
                {
                  key: "open",
                  header: "Open",
                  cell: (row) => (
                    <Link href={`/rentals/${row.id}`} className={buttonClass("quiet")}>
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
