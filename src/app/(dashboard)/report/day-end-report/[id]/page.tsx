import type { Metadata } from "next";
import DayEndReportView from "../_components/day-end-report";

export const metadata: Metadata = {
  title: "Day End Detail Report",
};

export default async function DayEndDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DayEndReportView batchId={id} />;
}
