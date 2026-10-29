import type { Metadata } from "next";
import { MonthlySalesTaxEntry } from "./_components/monthly-sales-tax-entry";

export const metadata: Metadata = {
  title: "Monthly Sales And Tax Report",
};

export default function MonthlySalesTaxPage() {
  return <MonthlySalesTaxEntry />;
}
