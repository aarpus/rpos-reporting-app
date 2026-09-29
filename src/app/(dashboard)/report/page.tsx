import Link from "next/link";
import type { IconType } from "react-icons";
import {
  LuArrowRight,
  LuCalendarClock,
  LuCalendarDays,
  LuCalendarRange,
  LuCalendarSync,
  LuClock3,
  LuReceiptText,
} from "react-icons/lu";

type ReportLink = {
  title: string;
  description: string;
  href: string;
  icon: IconType;
  iconClassName: string;
};

const reports: ReportLink[] = [
  {
    title: "Day End Report",
    description: "Review completed day-end batches and their totals.",
    href: "/report/day-end-report",
    icon: LuCalendarClock,
    iconClassName: "bg-badge-primary-background text-badge-primary-icon-color",
  },
  {
    title: "Month End Report",
    description: "View consolidated sales for a selected month.",
    href: "/report/month-end-report",
    icon: LuCalendarDays,
    iconClassName: "bg-badge-sky-background text-badge-sky-icon-color",
  },
  {
    title: "Week End Report",
    description: "Generate a summary for any week of the year.",
    href: "/report/week-end-report",
    icon: LuCalendarRange,
    iconClassName: "bg-badge-success-background text-badge-success-icon-color",
  },
  {
    title: "Year End Report",
    description: "Compare annual performance in one consolidated view.",
    href: "/report/year-end-report",
    icon: LuCalendarSync,
    iconClassName: "bg-badge-violet-background text-badge-violet-icon-color",
  },
  {
    title: "Employee Clock-In / Clock-Out",
    description: "Inspect employee attendance and working hours.",
    href: "/report/employee-clock-in-out",
    icon: LuClock3,
    iconClassName: "bg-badge-warning-background text-badge-warning-icon-color",
  },
  {
    title: "Shift Report",
    description: "Open sales and operations summaries by shift.",
    href: "/report/shift-report",
    icon: LuReceiptText,
    iconClassName: "bg-badge-pink-background text-badge-pink-icon-color",
  },
  {
    title: "Transaction Detail",
    description: "Find individual transactions and receipt details.",
    href: "/report/transaction-detail",
    icon: LuReceiptText,
    iconClassName: "bg-badge-error-background text-badge-error-icon-color",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 px-3 py-6 sm:px-5 lg:px-6">
      <div>
        <p className="text-sm font-medium text-primary-500">Reporting</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
          All reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-tertiary">
          Choose a report to review business performance, shifts, employees, or transactions.
        </p>
      </div>

      <section aria-label="Available reports" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map(({ title, description, href, icon: Icon, iconClassName }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-36 flex-col rounded-2xl border border-card-border bg-card-surface-area p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20"
          >
            <div className="flex items-start justify-between gap-4">
              <span className={`grid size-11 place-items-center rounded-xl ${iconClassName}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <LuArrowRight className="size-5 text-icon-tertiary transition-transform group-hover:translate-x-1 group-hover:text-primary-500" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-text-primary">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-text-tertiary">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
