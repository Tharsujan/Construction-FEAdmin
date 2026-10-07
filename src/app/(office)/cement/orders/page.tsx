import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersScreen } from "@/components/cement/OrdersScreen";

export const metadata: Metadata = { title: "Cement orders" };

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading cement orders…</p>}>
      <OrdersScreen />
    </Suspense>
  );
}
