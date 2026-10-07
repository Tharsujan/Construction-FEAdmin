import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetail } from "@/components/cement/OrderDetail";

export const metadata: Metadata = { title: "Cement order" };

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-muted">Loading the order…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}
