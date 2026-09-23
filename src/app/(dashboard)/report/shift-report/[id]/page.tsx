import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShiftEndReportView from "../_components/shift-end-report";
import { shifts } from "../_components/data";

export const metadata: Metadata = {
  title: "Shift End Report",
};

export default async function ShiftEndReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shift = shifts.find((item) => item.id === id);

  if (!shift) {
    notFound();
  }

  return <ShiftEndReportView shiftId={id} />;
}
