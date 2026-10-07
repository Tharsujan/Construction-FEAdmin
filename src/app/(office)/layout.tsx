import { Suspense } from "react";
import { AdminShell } from "@/components/AdminShell";

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="grid min-h-dvh place-items-center px-6 text-muted">Opening the yard office…</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
