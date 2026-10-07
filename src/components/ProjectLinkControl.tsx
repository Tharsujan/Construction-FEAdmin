"use client";

import { useState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";
import type { Project } from "@/lib/types";

export function ProjectLinkControl({
  projects,
  projectsError,
  projectId,
  projectName,
  busy,
  onSave,
}: {
  projects: Project[];
  projectsError: string | null;
  projectId: string | null;
  projectName: string | null;
  busy: boolean;
  onSave: (projectId: string | null) => void;
}) {
  const [value, setValue] = useState(projectId ?? "");
  const known = projects.some((project) => project.id === projectId);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(value || null);
      }}
    >
      <Field label="Company site" hint="Link this when the delivery or machine is going to one of the yard sites. Clear it to leave the link empty.">
        <select value={value} onChange={(event) => setValue(event.target.value)} className={inputClass} disabled={busy}>
          <option value="">No company site</option>
          {projectId && projectName && !known ? <option value={projectId}>{projectName}</option> : null}
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </Field>
      {projectsError ? <Alert>{projectsError}</Alert> : null}
      <Button type="submit" variant="secondary" disabled={busy || value === (projectId ?? "")}>
        {busy ? "Saving…" : "Save site link"}
      </Button>
    </form>
  );
}
