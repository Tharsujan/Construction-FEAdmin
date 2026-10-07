import type { Metadata } from "next";
import { UnitsScreen } from "@/components/units/UnitsScreen";

export const metadata: Metadata = { title: "Units" };

export default function UnitsPage() {
  return <UnitsScreen />;
}
