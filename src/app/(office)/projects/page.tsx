import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsScreen } from "@/components/projects/ProjectsScreen";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading projects…</p>}>
      <ProjectsScreen />
    </Suspense>
  );
}
