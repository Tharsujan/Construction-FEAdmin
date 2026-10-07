import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

export const metadata: Metadata = { title: "Project" };

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-muted">Loading the project…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
