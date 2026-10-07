"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  CheckField,
  EmptyState,
  Field,
  FilterBar,
  Flag,
  LoadState,
  Notice,
  PageHeading,
  Records,
  Sheet,
  StatusBadge,
  buttonClass,
  inputClass,
} from "@/components/ui";
import { send } from "@/lib/api";
import { clientSiteLabel, errorText, formatDate, label } from "@/lib/format";
import { useQueryFilter } from "@/lib/use-query-filter";
import { useResource } from "@/lib/use-resource";
import type { Project, ProjectStatus } from "@/lib/types";

const FILTERS: { value: "" | ProjectStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "Planned", label: "Planned" },
  { value: "InProgress", label: "In progress" },
  { value: "OnHold", label: "On hold" },
  { value: "Completed", label: "Completed" },
];

type Editor = { mode: "create" } | { mode: "edit"; project: Project } | null;

export function ProjectsScreen() {
  const [status, setStatus] = useQueryFilter("status");
  const path = status ? `/api/admin/projects?status=${encodeURIComponent(status)}` : "/api/admin/projects";
  const projects = useResource<Project[]>(path);
  const [editor, setEditor] = useState<Editor>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <PageHeading
        kicker="Sites"
        title="Projects"
        lede="A new project starts as Planned. Planned is Upcoming on the client site, and In progress is Ongoing. Hidden projects stay off the client site."
        action={<Button onClick={() => setEditor({ mode: "create" })}>Add project</Button>}
      />
      <div className="mt-6 space-y-4">
        {notice ? <Notice>{notice}</Notice> : null}
        <FilterBar label="Project status" value={status} onChange={setStatus} options={FILTERS} />
        <LoadState loading={projects.loading} error={projects.error} ready={projects.data !== null} onRetry={projects.reload} label="Loading projects…">
          {projects.data && projects.data.length === 0 ? (
            <EmptyState title="No projects in this view" body="Add a site, or switch the filter." />
          ) : null}
          {projects.data && projects.data.length > 0 ? (
            <Records
              rows={projects.data}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "name",
                  header: "Project",
                  cell: (row) => (
                    <span>
                      <span className="block font-semibold">{row.name}</span>
                      <span className="text-sm text-muted">{row.siteAddress}</span>
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (row) => (
                    <span>
                      <StatusBadge status={row.status} />
                      {clientSiteLabel(row.status) ? (
                        <span className="mt-1 block text-xs text-muted">Client site: {clientSiteLabel(row.status)}</span>
                      ) : null}
                    </span>
                  ),
                },
                {
                  key: "dates",
                  header: "Dates",
                  cell: (row) => `${formatDate(row.startDate)} – ${formatDate(row.endDate)}`,
                },
                { key: "public", header: "Client site", cell: (row) => <Flag on={row.isPublic} onLabel="Public" offLabel="Hidden" /> },
                {
                  key: "open",
                  header: "Open",
                  cell: (row) => (
                    <Link href={`/projects/${row.id}`} className={buttonClass("quiet")}>
                      Open
                    </Link>
                  ),
                },
              ]}
            />
          ) : null}
        </LoadState>
      </div>
      <Sheet open={editor !== null} title={editor?.mode === "edit" ? "Edit project" : "Add project"} onClose={() => setEditor(null)}>
        {editor ? (
          <ProjectForm
            key={editor.mode === "edit" ? editor.project.id : "new"}
            project={editor.mode === "edit" ? editor.project : null}
            onSaved={(message) => {
              setNotice(message);
              setEditor(null);
              projects.reload();
            }}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

export function ProjectForm({ project, onSaved }: { project: Project | null; onSaved: (message: string) => void }) {
  const [name, setName] = useState(project?.name ?? "");
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [siteAddress, setSiteAddress] = useState(project?.siteAddress ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [startDate, setStartDate] = useState(project?.startDate.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(project?.endDate.slice(0, 10) ?? "");
  const [isPublic, setIsPublic] = useState(project?.isPublic ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (endDate < startDate) {
      setError("The end date cannot be before the start date.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        summary: summary.trim(),
        siteAddress: siteAddress.trim(),
        description: description.trim(),
        startDate,
        endDate,
        isPublic,
      };
      if (project) {
        await send(`/api/admin/projects/${project.id}`, "PUT", body);
        onSaved(`${name.trim()} was updated. Status was left unchanged.`);
      } else {
        await send("/api/admin/projects", "POST", body);
        onSaved(`${name.trim()} was added as ${label("Planned")}.`);
      }
    } catch (caught) {
      setError(errorText(caught));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name">
        <input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
      </Field>
      <Field label="Summary">
        <input required maxLength={300} value={summary} onChange={(event) => setSummary(event.target.value)} className={inputClass} />
      </Field>
      <Field label="Site address">
        <input required maxLength={300} value={siteAddress} onChange={(event) => setSiteAddress(event.target.value)} className={inputClass} />
      </Field>
      <Field label="Description">
        <textarea required maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} className={`${inputClass} min-h-28`} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputClass} />
        </Field>
        <Field label="End date">
          <input required type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputClass} />
        </Field>
      </div>
      <CheckField
        checked={isPublic}
        onChange={setIsPublic}
        label="Visible on the client site"
        hint="Public controls whether customers can see it. Status is changed from the project page."
      />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? "Saving…" : project ? "Save project" : "Add project"}
      </Button>
    </form>
  );
}
