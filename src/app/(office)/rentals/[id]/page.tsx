import type { Metadata } from "next";
import { Suspense } from "react";
import { RentalDetail } from "@/components/rentals/RentalDetail";

export const metadata: Metadata = { title: "Rental" };

export default function RentalPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-muted">Loading the rental…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RentalDetail id={id} />;
}
