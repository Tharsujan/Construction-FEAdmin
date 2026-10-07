"use client";

import { useState } from "react";
import { AssignmentTable } from "@/components/projects/ProjectDetail";
import { WorkerForm } from "@/components/workers/WorkersScreen";
import { Alert, BackLink, Button, EmptyState, Flag, LoadState, MetaGrid, Missing, Notice, PageHeading, Section, Sheet } from "@/components/ui";
import { money, todayInput } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { WorkerDetail as WorkerDetailData } from "@/lib/types";

export function WorkerDetail({ id }: { id: string }) {
  const detail = useResource<WorkerDetailData>(`/api/admin/workers/${id}`);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (detail.status === 404) {
    return <Missing title="Worker was not found" body="They may have been removed, or the link is out of date." href="/workers" action="Back to workers" />;
  }

  const worker = detail.data?.worker ?? null;
  const today = todayInput();
  const current = (detail.data?.assignments ?? []).filter((item) => item.endDate >= today);
  const past = (detail.data?.assignments ?? []).filter((item) => item.endDate < today);

  return (
    <div>
      <BackLink href="/workers">All workers</BackLink>
      <div className="mt-2">
        <LoadState loading={detail.loading} error={detail.error} ready={detail.data !== null} onRetry={detail.reload} label="Loading the worker…">
          {detail.data && worker ? (
            <>
              <PageHeading
                kicker={worker.trade}
                title={worker.name}
                lede={worker.isActive ? "Active crew. Send them to a site from a project." : "Inactive. They cannot be sent to a project until they are active again."}
                action={<Button onClick={() => setEditing(true)}>Edit details</Button>}
              />
              <div className="mt-4">
                <Flag on={worker.isActive} onLabel="Active" offLabel="Inactive" />
              </div>
              <MetaGrid
                items={[
                  {
                    label: "Phone",
                    value: (
                      <a href={`tel:${worker.phone}`} className="font-semibold hover:underline">
                        {worker.phone}
                      </a>
                    ),
                  },
                  { label: "Daily rate", value: money(worker.dailyRate) },
                  { label: "Trade", value: worker.trade },
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
              <Section title="Current and upcoming">
                {current.length === 0 ? (
                  <EmptyState title="Nothing scheduled" body="Assignments that are on site today, or still ahead, show here." />
                ) : (
                  <AssignmentTable
                    rows={current}
                    showProject
                    busy={busy}
                    onEnded={(message) => {
                      setNotice(message);
                      detail.reload();
                    }}
                    onError={setError}
                    setBusy={setBusy}
                  />
                )}
              </Section>
              <Section title="Past assignments">
                {past.length === 0 ? (
                  <EmptyState title="No past assignments" body="Finished assignments stay on this page." />
                ) : (
                  <AssignmentTable
                    rows={past}
                    showProject
                    busy={busy}
                    onEnded={(message) => {
                      setNotice(message);
                      detail.reload();
                    }}
                    onError={setError}
                    setBusy={setBusy}
                  />
                )}
              </Section>
              <Sheet open={editing} title="Edit worker" onClose={() => setEditing(false)}>
                <WorkerForm
                  key={worker.id}
                  worker={worker}
                  onSaved={(message) => {
                    setNotice(message);
                    setEditing(false);
                    detail.reload();
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
