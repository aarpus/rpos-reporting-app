import type { Metadata } from "next";
import { NoUpcDetailEntry } from "./_components/no-upc-detail-entry";

export const metadata: Metadata = {
  title: "NoUPC Details Report",
};

export default function NoUpcDetailPage() {
  return <NoUpcDetailEntry />;
}
