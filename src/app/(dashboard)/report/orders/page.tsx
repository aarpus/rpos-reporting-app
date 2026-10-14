import type { Metadata } from "next";
import OrderReporting from "./order-reporting";

export const metadata: Metadata = { title: "Store Order Reporting" };

export default function OrderReportingPage() {
  return <OrderReporting />;
}
