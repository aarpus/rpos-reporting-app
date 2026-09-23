import type { Metadata } from "next";
import EmployeeClockReport from "./_components/employee-clock-report";

export const metadata: Metadata = {
  title: "Employee Clock-In / Clock-Out",
};

export default function EmployeeClockReportPage() {
  return <EmployeeClockReport />;
}
