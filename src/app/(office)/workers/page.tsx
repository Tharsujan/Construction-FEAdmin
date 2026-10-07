import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkersScreen } from "@/components/workers/WorkersScreen";

export const metadata: Metadata = { title: "Workers" };

export default function WorkersPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading workers…</p>}>
      <WorkersScreen />
    </Suspense>
  );
}
