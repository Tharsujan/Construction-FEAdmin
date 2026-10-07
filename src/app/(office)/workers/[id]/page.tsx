import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkerDetail } from "@/components/workers/WorkerDetail";

export const metadata: Metadata = { title: "Worker" };

export default function WorkerPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-muted">Loading the worker…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkerDetail id={id} />;
}
