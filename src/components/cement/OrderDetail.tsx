"use client";

import { useState } from "react";
import { ProjectLinkControl } from "@/components/ProjectLinkControl";
import {
  Alert,
  BackLink,
  Button,
  LoadState,
  MetaGrid,
  Missing,
  Notice,
  PageHeading,
  Panel,
  Records,
  StatusBadge,
} from "@/components/ui";
import { send } from "@/lib/api";
import { errorText, formatDateTime, formatQty, money } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { CementOrder, OrderStatus, PaymentStatus, Project } from "@/lib/types";

const MOVES: Record<OrderStatus, { status: OrderStatus; label: string; variant: "primary" | "danger" }[]> = {
  Pending: [
    { status: "Confirmed", label: "Confirm order", variant: "primary" },
    { status: "Cancelled", label: "Cancel order", variant: "danger" },
  ],
  Confirmed: [
    { status: "OutForDelivery", label: "Send for delivery", variant: "primary" },
    { status: "Cancelled", label: "Cancel order", variant: "danger" },
  ],
  OutForDelivery: [
    { status: "Delivered", label: "Mark delivered", variant: "primary" },
    { status: "Cancelled", label: "Cancel order", variant: "danger" },
  ],
  Delivered: [],
  Cancelled: [],
};

const HINTS: Partial<Record<OrderStatus, string>> = {
  Pending: "Confirming takes the ordered quantity out of stock. If a product is short, the order stays pending and the error from the API is shown here.",
  Confirmed: "Sending it out does not change stock again. Cancelling now puts the stock back.",
  OutForDelivery: "Marking it delivered closes the order. Cancelling from here puts the stock back.",
};

export function OrderDetail({ id }: { id: string }) {
  const order = useResource<CementOrder>(`/api/admin/cement/orders/${id}`);
  const projects = useResource<Project[]>("/api/admin/projects");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState<OrderStatus | null>(null);

  async function patch(path: string, body: unknown, message: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await send(path, "PATCH", body);
      setArmed(null);
      setNotice(message);
      order.reload();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  if (order.status === 404) {
    return <Missing title="Order was not found" body="It may have been removed, or the link is out of date." href="/cement/orders" action="Back to orders" />;
  }

  const current = order.data;

  return (
    <div>
      <BackLink href="/cement/orders">All cement orders</BackLink>
      <div className="mt-2">
        <LoadState loading={order.loading} error={order.error} ready={current !== null} onRetry={order.reload} label="Loading the order…">
          {current ? (
            <>
              <PageHeading kicker="Cement order" title={current.clientName} lede={current.deliveryAddress} />
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge status={current.status} />
                <StatusBadge status={current.paymentStatus} />
              </div>
              <MetaGrid
                items={[
                  { label: "Placed", value: formatDateTime(current.createdAt) },
                  { label: "Total", value: money(current.total) },
                  { label: "Company site", value: current.projectName ?? "Not linked" },
                  { label: "Lines", value: String(current.items.length) },
                ]}
              />
              {notice ? (
                <div className="mt-4">
                  <Notice>{notice}</Notice>
                </div>
              ) : null}
              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section>
                  <h2 className="font-display text-3xl">Line items</h2>
                  <div className="mt-3">
                    <Records
                      rows={current.items}
                      rowKey={(row) => row.productId}
                      columns={[
                        { key: "name", header: "Product", cell: (row) => row.productName },
                        { key: "qty", header: "Quantity", cell: (row) => formatQty(row.quantity) },
                        { key: "price", header: "Unit price", cell: (row) => money(row.unitPrice) },
                        { key: "total", header: "Line total", cell: (row) => money(row.lineTotal) },
                      ]}
                    />
                  </div>
                </section>
                <div className="order-first space-y-4 lg:order-none">
                  <Panel title="Status">
                    {HINTS[current.status] ? <p className="text-sm text-muted">{HINTS[current.status]}</p> : null}
                    {MOVES[current.status].length === 0 ? <p className="text-sm text-muted">This order cannot move further.</p> : null}
                    {error ? <Alert>{error}</Alert> : null}
                    <div className="flex flex-col gap-2">
                      {MOVES[current.status].map((move) =>
                        armed === move.status ? (
                          <div key={move.status} className="flex flex-col gap-2 border border-line p-3">
                            <p className="text-sm font-semibold">Confirm: {move.label}</p>
                            <Button
                              variant={move.variant}
                              disabled={busy}
                              onClick={() =>
                                void patch(`/api/admin/cement/orders/${current.id}/status`, { status: move.status }, `Order marked ${move.label.toLowerCase()}.`)
                              }
                            >
                              {busy ? "Saving…" : move.label}
                            </Button>
                            <Button variant="quiet" disabled={busy} onClick={() => setArmed(null)}>
                              Back
                            </Button>
                          </div>
                        ) : (
                          <Button key={move.status} variant={move.variant} disabled={busy} onClick={() => setArmed(move.status)}>
                            {move.label}
                          </Button>
                        ),
                      )}
                    </div>
                  </Panel>
                  <Panel title="Payment">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={current.paymentStatus} />
                      <Button
                        variant="quiet"
                        disabled={busy}
                        onClick={() => {
                          const paymentStatus: PaymentStatus = current.paymentStatus === "Paid" ? "Unpaid" : "Paid";
                          void patch(`/api/admin/cement/orders/${current.id}/payment`, { paymentStatus }, `Payment marked ${paymentStatus.toLowerCase()}.`);
                        }}
                      >
                        {current.paymentStatus === "Paid" ? "Mark unpaid" : "Mark paid"}
                      </Button>
                    </div>
                  </Panel>
                  <Panel title="Site link">
                    <ProjectLinkControl
                      key={current.projectId ?? "none"}
                      projects={projects.data ?? []}
                      projectsError={projects.error}
                      projectId={current.projectId}
                      projectName={current.projectName}
                      busy={busy}
                      onSave={(projectId) =>
                        void patch(
                          `/api/admin/cement/orders/${current.id}/project`,
                          { projectId },
                          projectId ? "Order linked to a company site." : "Site link cleared.",
                        )
                      }
                    />
                  </Panel>
                </div>
              </div>
            </>
          ) : null}
        </LoadState>
      </div>
    </div>
  );
}
