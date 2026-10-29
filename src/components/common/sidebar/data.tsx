import type { StoreType } from "@/lib/store-type";
import {
  CalendarIcon,
  HomeIcon,
  InvoiceIcon,
  PieChartIcon,
  TableIcon,
} from "./icon";
import type { ReactNode } from "react";

type NavigationItem = {
  title: string;
  icon: ReactNode;
  url?: string;
  items?: Array<{ title: string; url: string }>;
};

type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

const RETAIL_QUICK_REPORTS: NavigationItem[] = [
  {
    title: "Shift End Report",
    icon: <CalendarIcon />,
    url: "/report/shift-report",
  },
  {
    title: "Day-End Report",
    icon: <CalendarIcon />,
    url: "/report/day-end-report",
  },
  {
    title: "Week End Report",
    icon: <CalendarIcon />,
    url: "/report/week-end-report",
  },
  {
    title: "Month End Report",
    icon: <CalendarIcon />,
    url: "/report/month-end-report",
  },
  { title: "Transaction Journal", icon: <TableIcon /> },
  {
    title: "Credit Card Transaction",
    icon: <InvoiceIcon />,
    url: "/report/credit-card-transaction",
  },
  {
    title: "Monthly Sales and Tax",
    icon: <TableIcon />,
    url: "/report/monthly-sales-tax",
  },
  {
    title: "Invoice Report",
    icon: <InvoiceIcon />,
    url: "/report/invoice-report",
  },
  { title: "NoUPC Details Report", icon: <TableIcon /> },
];

function retailNavigation(includeMobileReports: boolean): NavigationSection[] {
  return [
    {
      label: "MAIN MENU",
      items: [
        {
          title: "Dashboard",
          icon: <HomeIcon />,
          url: "/",
        },
        ...(includeMobileReports
          ? [{ title: "Reports", icon: <TableIcon />, url: "/report" }]
          : []),
      ],
    },
    {
      label: "QUICK REPORTS",
      items: RETAIL_QUICK_REPORTS,
    },
  ];
}

export function navigationFor(
  storeType: StoreType | null,
  options?: { includeMobileReports?: boolean },
): NavigationSection[] {
  if (storeType === "RETAIL") {
    return retailNavigation(options?.includeMobileReports ?? false);
  }
  return NAV_DATA;
}

export const NAV_DATA: NavigationSection[] = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: <HomeIcon />,
        url: "/",
      },
    ],
  },
  {
    label: "QUICK REPORTS",
    items: [
      {
        title: "Store Order Reporting",
        icon: <TableIcon />,
        url: "/report/orders",
      },
      {
        title: "Shift End Report",
        icon: <CalendarIcon />,
        url: "/report/shift-report",
      },
      {
        title: "Day End Reports",
        icon: <InvoiceIcon />,
        url: "/report/day-end-report",
      },
      {
        title: "Week End Report",
        icon: <CalendarIcon />,
        url: "/report/week-end-report",
      },
      {
        title: "Month End Report",
        icon: <CalendarIcon />,
        url: "/report/month-end-report",
      },
      {
        title: "Year End Report",
        icon: <CalendarIcon />,
        url: "/report/year-end-report",
      },

      {
        title: "Employee Clock-In-Out",
        icon: <CalendarIcon />,
        url: "/report/employee-clock-in-out",
      },
      {
        title: "Transaction Detail",
        icon: <TableIcon />,
        url: "/report/transaction-detail",
      },
    ],
  },
  {
    label: "OTHERS",
    items: [
      {
        title: "Charts",
        icon: <PieChartIcon />,
        items: [
          { title: "Bar Charts", url: "/charts/bar" },
          { title: "Line Charts", url: "/charts/line" },
          { title: "Pie Charts", url: "/charts/pie" },
        ],
      },
    ],
  },
];
