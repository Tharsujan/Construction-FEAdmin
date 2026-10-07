import type { Metadata } from "next";
import { Suspense } from "react";
import { RentalsScreen } from "@/components/rentals/RentalsScreen";

export const metadata: Metadata = { title: "Rentals" };

export default function RentalsPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading rentals…</p>}>
      <RentalsScreen />
    </Suspense>
  );
}
