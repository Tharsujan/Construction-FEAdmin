"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  EmptyState,
  Field,
  FilterBar,
  LoadState,
  Notice,
  PageHeading,
  Records,
  Sheet,
  StatusBadge,
  inputClass,
} from "@/components/ui";
import { send } from "@/lib/api";
import { errorText, money } from "@/lib/format";
import { useQueryFilter } from "@/lib/use-query-filter";
import { useResource } from "@/lib/use-resource";
import type { Equipment, EquipmentStatus } from "@/lib/types";

type Editor = { mode: "create" } | { mode: "edit"; equipment: Equipment } | null;

const FILTERS = [
  { value: "", label: "All" },
  { value: "Available", label: "Available" },
  { value: "Rented", label: "Rented" },
  { value: "Maintenance", label: "Maintenance" },
];

export function EquipmentScreen() {
  const equipment = useResource<Equipment[]>("/api/admin/equipment");
  const [status, setStatus] = useQueryFilter("status");
  const [editor, setEditor] = useState<Editor>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = (equipment.data ?? []).filter((item) => (status ? item.status === status : true));

  async function setMachineStatus(item: Equipment, next: EquipmentStatus) {
    setBusyId(item.id);
    setActionError(null);
    setNotice(null);
    try {
      await send(`/api/admin/equipment/${item.id}/status`, "PATCH", { status: next });
      setNotice(`${item.name} is now ${next === "Maintenance" ? "in maintenance" : "available"}.`);
      equipment.reload();
    } catch (caught) {
      setActionError(errorText(caught));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeading
        kicker="Yard"
        title="Equipment"
        lede="New machines start as available. A rented machine has to be returned before its status can change."
        action={<Button onClick={() => setEditor({ mode: "create" })}>Add machine</Button>}
      />
      <div className="mt-6 space-y-4">
        {notice ? <Notice>{notice}</Notice> : null}
        {actionError ? <Alert>{actionError}</Alert> : null}
        <FilterBar label="Equipment status" value={status} onChange={setStatus} options={FILTERS} />
        <LoadState
          loading={equipment.loading}
          error={equipment.error}
          ready={equipment.data !== null}
          onRetry={equipment.reload}
          label="Loading equipment…"
        >
          {equipment.data && rows.length === 0 ? (
            <EmptyState title="No machines in this view" body="Add a machine, or switch the filter." />
          ) : null}
          {rows.length > 0 ? (
            <Records
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "name",
                  header: "Machine",
                  cell: (row) => (
                    <span>
                      <span className="block font-semibold">{row.name}</span>
                      <span className="text-sm tracking-wide text-muted">{row.code}</span>
                    </span>
                  ),
                },
                { key: "rate", header: "Daily rate", cell: (row) => money(row.dailyRate) },
                { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
                {
                  key: "actions",
                  header: "Actions",
                  cell: (row) => (
                    <div className="flex flex-col items-start gap-2">
                      <Button variant="quiet" onClick={() => setEditor({ mode: "edit", equipment: row })}>
                        Edit
                      </Button>
                      {row.status === "Rented" ? (
                        <p className="max-w-xs text-sm text-muted">Return the rental before changing this machine.</p>
                      ) : (
                        <Button
                          variant="secondary"
                          disabled={busyId === row.id}
                          onClick={() => void setMachineStatus(row, row.status === "Available" ? "Maintenance" : "Available")}
                        >
                          {row.status === "Available" ? "Send to maintenance" : "Mark available"}
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          ) : null}
        </LoadState>
      </div>
      <Sheet open={editor !== null} title={editor?.mode === "edit" ? "Edit machine" : "Add machine"} onClose={() => setEditor(null)}>
        {editor ? (
          <EquipmentForm
            key={editor.mode === "edit" ? editor.equipment.id : "new"}
            equipment={editor.mode === "edit" ? editor.equipment : null}
            onSaved={(message) => {
              setNotice(message);
              setEditor(null);
              equipment.reload();
            }}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

function EquipmentForm({ equipment, onSaved }: { equipment: Equipment | null; onSaved: (message: string) => void }) {
  const [name, setName] = useState(equipment?.name ?? "");
  const [code, setCode] = useState(equipment?.code ?? "");
  const [dailyRate, setDailyRate] = useState(equipment ? String(equipment.dailyRate) : "");
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
      const body = { name: name.trim(), code: code.trim(), dailyRate: rate };
      if (equipment) {
        await send(`/api/admin/equipment/${equipment.id}`, "PUT", body);
        onSaved(`${name.trim()} was updated.`);
      } else {
        await send("/api/admin/equipment", "POST", body);
        onSaved(`${name.trim()} was added and is available.`);
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
      <Field label="Code" hint="Codes are unique across the yard.">
        <input required maxLength={40} value={code} onChange={(event) => setCode(event.target.value)} className={inputClass} />
      </Field>
      <Field label="Daily rate">
        <input required type="number" min="0.01" step="0.01" value={dailyRate} onChange={(event) => setDailyRate(event.target.value)} className={inputClass} />
      </Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? "Saving…" : equipment ? "Save machine" : "Add machine"}
      </Button>
    </form>
  );
}
