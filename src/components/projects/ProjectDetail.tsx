"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ProjectForm } from "@/components/projects/ProjectsScreen";
import {
  Alert,
  BackLink,
  Button,
  EmptyState,
  Field,
  LoadState,
  MetaGrid,
  Missing,
  Notice,
  PageHeading,
  Records,
  Section,
  Sheet,
  StatusBadge,
  Flag,
  buttonClass,
  inputClass,
} from "@/components/ui";
import { send } from "@/lib/api";
import { assignmentPhase, clientSiteLabel, errorText, formatDate, formatDateTime, money, todayInput } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { Assignment, ProjectStatus, ProjectWorkspace, Worker } from "@/lib/types";

const STATUSES: ProjectStatus[] = ["Planned", "InProgress", "OnHold", "Completed"];

export function ProjectDetail({ id }: { id: string }) {
  const workspace = useResource<ProjectWorkspace>(`/api/admin/projects/${id}`);
  const workers = useResource<Worker[]>("/api/admin/workers?active=true");
  const [editing, setEditing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (workspace.status === 404) {
    return <Missing title="Project was not found" body="It may have been removed, or the link is out of date." href="/projects" action="Back to projects" />;
  }

  const project = workspace.data?.project ?? null;

  async function changeStatus(status: ProjectStatus) {
    if (!project) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await send(`/api/admin/projects/${project.id}/status`, "PATCH", { status });
      setNotice("Project status updated.");
      workspace.reload();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <BackLink href="/projects">All projects</BackLink>
      <div className="mt-2">
        <LoadState loading={workspace.loading} error={workspace.error} ready={workspace.data !== null} onRetry={workspace.reload} label="Loading the project…">
          {workspace.data && project ? (
            <>
              <PageHeading kicker="Project" title={project.name} lede={project.summary} action={<Button onClick={() => setEditing(true)}>Edit details</Button>} />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge status={project.status} />
                <Flag on={project.isPublic} onLabel="Public" offLabel="Hidden" />
                {clientSiteLabel(project.status) ? (
                  <span className="text-sm text-muted">Client site shows {clientSiteLabel(project.status)}</span>
                ) : null}
              </div>
              <MetaGrid
                items={[
                  { label: "Site address", value: project.siteAddress },
                  { label: "Dates", value: `${formatDate(project.startDate)} – ${formatDate(project.endDate)}` },
                  { label: "Description", value: project.description },
                ]}
              />
              {notice ? (
                <div className="mt-4">
                  <Notice>{notice}</Notice>
                </div>
              ) : null}
              {error ? (
                <div className="mt-4">
                  <Alert>{error}</Alert>
                </div>
              ) : null}
              <section className="mt-6">
                <h2 className="font-display text-3xl">Status</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted">
                  Planned is Upcoming on the client site. In progress is Ongoing. On hold and Completed stay off that pair of labels. A hidden project stays off the client site either way.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STATUSES.map((status) => (
                    <Button key={status} variant={status === project.status ? "secondary" : "quiet"} disabled={busy || status === project.status} onClick={() => void changeStatus(status)}>
                      {status === "Planned" ? "Planned" : status === "InProgress" ? "In progress" : status === "OnHold" ? "On hold" : "Completed"}
                    </Button>
                  ))}
                </div>
              </section>
              <Section title="Crew" action={<Button onClick={() => setAssigning(true)}>Send a worker</Button>}>
                {workspace.data.assignments.length === 0 ? (
                  <EmptyState title="No one is assigned" body="Send an active worker to this site. Overlapping dates for the same worker are rejected." />
                ) : (
                  <AssignmentTable
                    rows={workspace.data.assignments}
                    showWorker
                    busy={busy}
                    onEnded={(message) => {
                      setNotice(message);
                      workspace.reload();
                    }}
                    onError={setError}
                    setBusy={setBusy}
                  />
                )}
              </Section>
              <Section title="Cement orders">
                {workspace.data.cementOrders.length === 0 ? (
                  <EmptyState title="No cement linked" body="Link a delivery from the order page when it is going to this site." />
                ) : (
                  <Records
                    rows={workspace.data.cementOrders}
                    rowKey={(row) => row.id}
                    columns={[
                      { key: "customer", header: "Customer", cell: (row) => row.clientName },
                      { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
                      { key: "total", header: "Total", cell: (row) => money(row.total) },
                      { key: "placed", header: "Placed", cell: (row) => formatDateTime(row.createdAt) },
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
                )}
              </Section>
              <Section title="Rentals">
                {workspace.data.rentals.length === 0 ? (
                  <EmptyState title="No machines linked" body="Link a rental from the rental page when the machine is going to this site." />
                ) : (
                  <Records
                    rows={workspace.data.rentals}
                    rowKey={(row) => row.id}
                    columns={[
                      { key: "machine", header: "Machine", cell: (row) => row.equipmentName },
                      { key: "customer", header: "Customer", cell: (row) => row.clientName },
                      { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
                      {
                        key: "dates",
                        header: "Dates",
                        cell: (row) => `${formatDate(row.startDate)} – ${formatDate(row.expectedReturn)}`,
                      },
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
                )}
              </Section>
              <Sheet open={editing} title="Edit project" onClose={() => setEditing(false)}>
                <ProjectForm
                  key={project.id}
                  project={project}
                  onSaved={(message) => {
                    setNotice(message);
                    setEditing(false);
                    workspace.reload();
                  }}
                />
              </Sheet>
              <Sheet open={assigning} title="Send a worker" onClose={() => setAssigning(false)}>
                <AssignForm
                  projectId={project.id}
                  workers={workers.data ?? []}
                  workersError={workers.error}
                  onSaved={(message) => {
                    setNotice(message);
                    setAssigning(false);
                    workspace.reload();
                  }}
                />
              </Sheet>
            </>
          ) : null}
        </LoadState>
      </div>
    </div>
  );
}

export function AssignmentTable({
  rows,
  showWorker,
  showProject = false,
  busy,
  onEnded,
  onError,
  setBusy,
}: {
  rows: Assignment[];
  showWorker?: boolean;
  showProject?: boolean;
  busy: boolean;
  onEnded: (message: string) => void;
  onError: (message: string | null) => void;
  setBusy: (busy: boolean) => void;
}) {
  return (
    <Records
      rows={rows}
      rowKey={(row) => row.id}
      columns={[
        ...(showWorker
          ? [
              {
                key: "worker",
                header: "Worker",
                cell: (row: Assignment) => (
                  <Link href={`/workers/${row.workerId}`} className="font-semibold hover:underline">
                    {row.workerName}
                    <span className="mt-1 block text-sm font-normal text-muted">{row.trade}</span>
                  </Link>
                ),
              },
            ]
          : []),
        ...(showProject
          ? [
              {
                key: "project",
                header: "Project",
                cell: (row: Assignment) => (
                  <Link href={`/projects/${row.projectId}`} className="font-semibold hover:underline">
                    {row.projectName}
                  </Link>
                ),
              },
            ]
          : []),
        {
          key: "dates",
          header: "Dates",
          cell: (row) => `${formatDate(row.startDate)} – ${formatDate(row.endDate)}`,
        },
        { key: "phase", header: "Phase", cell: (row) => <StatusBadge status={assignmentPhase(row.startDate, row.endDate)} /> },
        { key: "rate", header: "Daily rate", cell: (row) => money(row.dailyRate) },
        {
          key: "end",
          header: "End",
          cell: (row) =>
            row.endDate < todayInput() ? (
              <span className="text-sm text-muted">Closed</span>
            ) : (
              <EndAssignment assignment={row} busy={busy} onEnded={onEnded} onError={onError} setBusy={setBusy} />
            ),
        },
      ]}
    />
  );
}

function EndAssignment({
  assignment,
  busy,
  onEnded,
  onError,
  setBusy,
}: {
  assignment: Assignment;
  busy: boolean;
  onEnded: (message: string) => void;
  onError: (message: string | null) => void;
  setBusy: (busy: boolean) => void;
}) {
  const today = todayInput();
  const [endDate, setEndDate] = useState(today < assignment.startDate ? assignment.startDate : today);
  const [open, setOpen] = useState(false);

  async function finish(body: { endDate?: string }) {
    setBusy(true);
    onError(null);
    try {
      await send(`/api/admin/assignments/${assignment.id}/end`, "PATCH", body);
      setOpen(false);
      onEnded(`${assignment.workerName} was signed off this assignment.`);
    } catch (caught) {
      onError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="quiet" disabled={busy} onClick={() => setOpen(true)}>
        End
      </Button>
    );
  }

  return (
    <form
      className="flex min-w-52 flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void finish({ endDate });
      }}
    >
      <input required type="date" min={assignment.startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputClass} />
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "End on this date"}
      </Button>
      {today >= assignment.startDate ? (
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void finish({})}>
          End today
        </Button>
      ) : (
        <p className="text-sm text-muted">This assignment has not started, so today is before the start date.</p>
      )}
      <Button type="button" variant="quiet" disabled={busy} onClick={() => setOpen(false)}>
        Keep open
      </Button>
    </form>
  );
}

function AssignForm({
  projectId,
  workers,
  workersError,
  onSaved,
}: {
  projectId: string;
  workers: Worker[];
  workersError: string | null;
  onSaved: (message: string) => void;
}) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const workerId = pickedId && workers.some((worker) => worker.id === pickedId) ? pickedId : (workers[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!workerId) {
      setError("Add an active worker before sending someone to this site.");
      return;
    }
    if (endDate < startDate) {
      setError("The end date cannot be before the start date.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await send(`/api/admin/projects/${projectId}/assignments`, "POST", { workerId, startDate, endDate });
      onSaved("Worker sent to this site. The daily rate was copied from the worker.");
    } catch (caught) {
      setError(errorText(caught));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted">The worker must be active. Dates that overlap another assignment for that worker are rejected. The daily rate is copied at this moment.</p>
      <Field label="Worker">
        <select required value={workerId} onChange={(event) => setPickedId(event.target.value)} className={inputClass}>
          {workers.length === 0 ? <option value="">No active workers</option> : null}
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name} · {worker.trade}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputClass} />
        </Field>
        <Field label="End date">
          <input required type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputClass} />
        </Field>
      </div>
      {workersError ? <Alert>{workersError}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={busy || workers.length === 0}>
        {busy ? "Saving…" : "Send to site"}
      </Button>
    </form>
  );
}
