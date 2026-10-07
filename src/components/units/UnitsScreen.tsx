"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  CheckField,
  EmptyState,
  Field,
  Flag,
  LoadState,
  Notice,
  PageHeading,
  Records,
  Sheet,
  inputClass,
} from "@/components/ui";
import { send } from "@/lib/api";
import { errorText } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { ProductUnit } from "@/lib/types";

type Editor = { mode: "create" } | { mode: "edit"; unit: ProductUnit } | null;

export function UnitsScreen() {
  const units = useResource<ProductUnit[]>("/api/admin/units");
  const [editor, setEditor] = useState<Editor>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(unit: ProductUnit) {
    setBusyId(unit.id);
    setError(null);
    setNotice(null);
    try {
      await send(`/api/admin/units/${unit.id}`, "DELETE");
      setPendingDelete(null);
      setNotice(`${unit.name} was removed.`);
      units.reload();
    } catch (caught) {
      setError(errorText(caught));
      setPendingDelete(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeading
        kicker="Cement"
        title="Units"
        lede="Bag and Ton start here, and you can add more. A unit used by a product cannot be deleted. Turn it off instead, and it drops out of the product form."
        action={<Button onClick={() => setEditor({ mode: "create" })}>Add unit</Button>}
      />
      <div className="mt-6 space-y-4">
        {notice ? <Notice>{notice}</Notice> : null}
        {error ? <Alert>{error}</Alert> : null}
        <LoadState loading={units.loading} error={units.error} ready={units.data !== null} onRetry={units.reload} label="Loading units…">
          {units.data && units.data.length === 0 ? (
            <EmptyState title="No units yet" body="Add a unit before you can save a cement product." />
          ) : null}
          {units.data && units.data.length > 0 ? (
            <Records
              rows={units.data}
              rowKey={(row) => row.id}
              columns={[
                { key: "name", header: "Name", cell: (row) => <span className="font-semibold">{row.name}</span> },
                { key: "status", header: "Status", cell: (row) => <Flag on={row.isActive} onLabel="Active" offLabel="Inactive" /> },
                {
                  key: "actions",
                  header: "Actions",
                  cell: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="quiet" onClick={() => setEditor({ mode: "edit", unit: row })}>
                        Edit
                      </Button>
                      {pendingDelete === row.id ? (
                        <>
                          <Button variant="danger" disabled={busyId === row.id} onClick={() => void remove(row)}>
                            {busyId === row.id ? "Deleting…" : "Delete unit"}
                          </Button>
                          <Button variant="quiet" disabled={busyId === row.id} onClick={() => setPendingDelete(null)}>
                            Keep
                          </Button>
                        </>
                      ) : (
                        <Button variant="quiet" onClick={() => setPendingDelete(row.id)}>
                          Delete
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
      <Sheet open={editor !== null} title={editor?.mode === "edit" ? "Edit unit" : "Add unit"} onClose={() => setEditor(null)}>
        {editor ? (
          <UnitForm
            key={editor.mode === "edit" ? editor.unit.id : "new"}
            unit={editor.mode === "edit" ? editor.unit : null}
            onSaved={(message) => {
              setNotice(message);
              setError(null);
              setEditor(null);
              units.reload();
            }}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

function UnitForm({ unit, onSaved }: { unit: ProductUnit | null; onSaved: (message: string) => void }) {
  const [name, setName] = useState(unit?.name ?? "");
  const [isActive, setIsActive] = useState(unit?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { name: name.trim(), isActive };
      if (unit) {
        await send(`/api/admin/units/${unit.id}`, "PUT", body);
        onSaved(`${name.trim()} was updated.`);
      } else {
        await send("/api/admin/units", "POST", body);
        onSaved(`${name.trim()} was added.`);
      }
    } catch (caught) {
      setError(errorText(caught));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name">
        <input required maxLength={40} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
      </Field>
      <CheckField
        checked={isActive}
        onChange={setIsActive}
        label="Active"
        hint="Inactive units stay on products that already use them, and they leave the product form."
      />
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? "Saving…" : unit ? "Save unit" : "Add unit"}
      </Button>
    </form>
  );
}
