import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsScreen } from "@/components/cement/ProductsScreen";

export const metadata: Metadata = { title: "Cement products" };

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading cement products…</p>}>
      <ProductsScreen />
    </Suspense>
  );
}
