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
  buttonClass,
  inputClass,
} from "@/components/ui";
import { send } from "@/lib/api";
import { errorText, money } from "@/lib/format";
import { useQueryFilter } from "@/lib/use-query-filter";
import { useResource } from "@/lib/use-resource";
import type { Worker } from "@/lib/types";

type Editor = { mode: "create" } | { mode: "edit"; worker: Worker } | null;

export function WorkersScreen() {
  const [active, setActive] = useQueryFilter("active");
  const path = active === "true" || active === "false" ? `/api/admin/workers?active=${active}` : "/api/admin/workers";
  const workers = useResource<Worker[]>(path);
  const [editor, setEditor] = useState<Editor>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <PageHeading
        kicker="Crew"
        title="Workers"
        lede="New workers start active. Send someone to a site from the project page. The daily rate is copied onto that assignment."
        action={<Button onClick={() => setEditor({ mode: "create" })}>Add worker</Button>}
      />
      <div className="mt-6 space-y-4">
        {notice ? <Notice>{notice}</Notice> : null}
        <FilterBar
          label="Worker status"
          value={active}
          onChange={setActive}
          options={[
            { value: "", label: "All" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
        <LoadState loading={workers.loading} error={workers.error} ready={workers.data !== null} onRetry={workers.reload} label="Loading the crew…">
          {workers.data && workers.data.length === 0 ? (
            <EmptyState title="No workers in this view" body="Add a worker, or switch the filter." />
          ) : null}
          {workers.data && workers.data.length > 0 ? (
            <Records
              rows={workers.data}
              rowKey={(row) => row.id}
              columns={[
                { key: "name", header: "Name", cell: (row) => <span className="font-semibold">{row.name}</span> },
                { key: "trade", header: "Trade", cell: (row) => row.trade },
                {
                  key: "phone",
                  header: "Phone",
                  cell: (row) => (
                    <a href={`tel:${row.phone}`} className="font-semibold hover:underline">
                      {row.phone}
                    </a>
                  ),
                },
                { key: "rate", header: "Daily rate", cell: (row) => money(row.dailyRate) },
                { key: "active", header: "Status", cell: (row) => <Flag on={row.isActive} onLabel="Active" offLabel="Inactive" /> },
                {
                  key: "open",
                  header: "Open",
                  cell: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="quiet" onClick={() => setEditor({ mode: "edit", worker: row })}>
                        Edit
                      </Button>
                      <Link href={`/workers/${row.id}`} className={buttonClass("secondary")}>
                        Open
                      </Link>
                    </div>
                  ),
                },
              ]}
            />
          ) : null}
        </LoadState>
      </div>
      <Sheet open={editor !== null} title={editor?.mode === "edit" ? "Edit worker" : "Add worker"} onClose={() => setEditor(null)}>
        {editor ? (
          <WorkerForm
            key={editor.mode === "edit" ? editor.worker.id : "new"}
            worker={editor.mode === "edit" ? editor.worker : null}
            onSaved={(message) => {
              setNotice(message);
              setEditor(null);
              workers.reload();
            }}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

export function WorkerForm({ worker, onSaved }: { worker: Worker | null; onSaved: (message: string) => void }) {
  const [name, setName] = useState(worker?.name ?? "");
  const [trade, setTrade] = useState(worker?.trade ?? "");
  const [phone, setPhone] = useState(worker?.phone ?? "");
  const [dailyRate, setDailyRate] = useState(worker ? String(worker.dailyRate) : "");
  const [isActive, setIsActive] = useState(worker?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const rate = Number(dailyRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      setError("Enter a daily rate above zero.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (worker) {
        await send(`/api/admin/workers/${worker.id}`, "PUT", {
          trade: trade.trim(),
          phone: phone.trim(),
          dailyRate: rate,
          isActive,
        });
        onSaved(`${worker.name} was updated. The name stays as it is.`);
      } else {
        await send("/api/admin/workers", "POST", {
          name: name.trim(),
          trade: trade.trim(),
          phone: phone.trim(),
          dailyRate: rate,
        });
        onSaved(`${name.trim()} was added and is active.`);
      }
    } catch (caught) {
      setError(errorText(caught));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {worker ? (
        <p className="text-sm text-muted">Name stays {worker.name}. This form updates trade, phone, rate, and whether they can be sent to a site.</p>
      ) : (
        <Field label="Name">
          <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        </Field>
      )}
      <Field label="Trade">
        <input required maxLength={80} value={trade} onChange={(event) => setTrade(event.target.value)} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <input required maxLength={30} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Daily rate">
          <input required type="number" min="0.01" step="0.01" value={dailyRate} onChange={(event) => setDailyRate(event.target.value)} className={inputClass} />
        </Field>
      </div>
      {worker ? (
        <CheckField checked={isActive} onChange={setIsActive} label="Active" hint="Inactive workers cannot be sent to a project." />
      ) : null}
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? "Saving…" : worker ? "Save worker" : "Add worker"}
      </Button>
    </form>
  );
}
