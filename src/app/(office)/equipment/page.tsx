import type { Metadata } from "next";
import { Suspense } from "react";
import { EquipmentScreen } from "@/components/equipment/EquipmentScreen";

export const metadata: Metadata = { title: "Equipment" };

export default function EquipmentPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading equipment…</p>}>
      <EquipmentScreen />
    </Suspense>
  );
}
