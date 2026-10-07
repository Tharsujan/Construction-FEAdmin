"use client";

import { useState, type FormEvent } from "react";
import { ProjectLinkControl } from "@/components/ProjectLinkControl";
import {
  Alert,
  BackLink,
  Button,
  CheckField,
  Field,
  LoadState,
  MetaGrid,
  Missing,
  Notice,
  PageHeading,
  Panel,
  StatusBadge,
  inputClass,
} from "@/components/ui";
import { send } from "@/lib/api";
import { errorText, formatDate, formatDateTime, money } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { PaymentStatus, Project, Rental } from "@/lib/types";

export function RentalDetail({ id }: { id: string }) {
  const rental = useResource<Rental>(`/api/admin/rentals/${id}`);
  const projects = useResource<Project[]>("/api/admin/projects");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [armedCancel, setArmedCancel] = useState(false);

  async function patch(path: string, body: unknown, message: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await send(path, "PATCH", body);
      setArmedCancel(false);
      setNotice(message);
      rental.reload();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  if (rental.status === 404) {
    return <Missing title="Rental was not found" body="It may have been removed, or the link is out of date." href="/rentals" action="Back to rentals" />;
  }

  const current = rental.data;

  return (
    <div>
      <BackLink href="/rentals">All rentals</BackLink>
      <div className="mt-2">
        <LoadState loading={rental.loading} error={rental.error} ready={current !== null} onRetry={rental.reload} label="Loading the rental…">
          {current ? (
            <>
              <PageHeading kicker="Rental" title={current.equipmentName} lede={`${current.clientName} · ${current.siteAddress}`} />
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge status={current.status} />
                <StatusBadge status={current.paymentStatus} />
              </div>
              <MetaGrid
                items={[
                  { label: "Requested", value: formatDateTime(current.createdAt) },
                  { label: "Start", value: formatDate(current.startDate) },
                  { label: "Expected return", value: formatDate(current.expectedReturn) },
                  { label: "Actual return", value: current.actualReturn ? formatDate(current.actualReturn) : "Not returned" },
                  { label: "Daily rate", value: money(current.dailyRate) },
                  { label: "Deposit", value: money(current.deposit) },
                  { label: "Total", value: money(current.total) },
                  { label: "Company site", value: current.projectName ?? "Not linked" },
                ]}
              />
              {notice ? (
                <div className="mt-4">
                  <Notice>{notice}</Notice>
                </div>
              ) : null}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Panel title="Hire">
                  {error ? <Alert>{error}</Alert> : null}
                  {current.status === "Requested" ? (
                    <>
                      <p className="text-sm text-muted">Approving marks the machine rented. It fails if the machine is not available.</p>
                      <Button disabled={busy} onClick={() => void patch(`/api/admin/rentals/${current.id}/approve`, {}, "Rental approved. The machine is rented.")}>
                        {busy ? "Saving…" : "Approve rental"}
                      </Button>
                    </>
                  ) : null}
                  {current.status === "Active" ? <ReturnForm id={current.id} busy={busy} onSubmit={patch} /> : null}
                  {current.status === "Returned" ? <p className="text-sm text-muted">This rental is closed. The machine is available again.</p> : null}
                  {current.status === "Cancelled" ? <p className="text-sm text-muted">This rental was cancelled.</p> : null}
                  {current.status === "Requested" || current.status === "Active" ? (
                    armedCancel ? (
                      <div className="space-y-2 border border-line p-3">
                        <p className="text-sm font-semibold">
                          {current.status === "Active" ? "Cancelling frees the machine." : "Cancel this request?"}
                        </p>
                        <Button variant="danger" disabled={busy} onClick={() => void patch(`/api/admin/rentals/${current.id}/cancel`, {}, "Rental cancelled.")}>
                          {busy ? "Saving…" : "Cancel rental"}
                        </Button>
                        <Button variant="quiet" disabled={busy} onClick={() => setArmedCancel(false)}>
                          Keep it
                        </Button>
                      </div>
                    ) : (
                      <Button variant="danger" disabled={busy} onClick={() => setArmedCancel(true)}>
                        Cancel rental
                      </Button>
                    )
                  ) : null}
                </Panel>
                <div className="space-y-4">
                  <Panel title="Payment">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={current.paymentStatus} />
                      <Button
                        variant="quiet"
                        disabled={busy}
                        onClick={() => {
                          const paymentStatus: PaymentStatus = current.paymentStatus === "Paid" ? "Unpaid" : "Paid";
                          void patch(`/api/admin/rentals/${current.id}/payment`, { paymentStatus }, `Payment marked ${paymentStatus.toLowerCase()}.`);
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
                          `/api/admin/rentals/${current.id}/project`,
                          { projectId },
                          projectId ? "Rental linked to a company site." : "Site link cleared.",
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

function ReturnForm({
  id,
  busy,
  onSubmit,
}: {
  id: string;
  busy: boolean;
  onSubmit: (path: string, body: unknown, message: string) => Promise<void>;
}) {
  const [useToday, setUseToday] = useState(true);
  const [actualReturn, setActualReturn] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const body = useToday ? {} : { actualReturn };
    void onSubmit(idPath(id), body, "Machine returned. The charge uses the daily rate, with at least one day.");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-muted">The total is the daily rate times the number of days, with a minimum of one day. Leave today selected to let the API use today.</p>
      <CheckField checked={useToday} onChange={setUseToday} label="Use today as the return date" />
      {useToday ? null : (
        <Field label="Actual return">
          <input required type="date" value={actualReturn} onChange={(event) => setActualReturn(event.target.value)} className={inputClass} />
        </Field>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Record return"}
      </Button>
    </form>
  );
}

function idPath(id: string) {
  return `/api/admin/rentals/${id}/return`;
}
