import { CalendarDate } from "@internationalized/date";

export type RetailDayEndStatus = "Close" | "Open";

export type RetailDayEndRow = {
  id: string;
  batch: number;
  startLabel: string;
  endLabel: string;
  start: CalendarDate;
  end: CalendarDate;
  status: RetailDayEndStatus;
};

export type RetailDayEndLine = {
  label: string;
  value: string;
  emphasize?: boolean;
  divider?: boolean;
};

export type RetailDayEndDepartment = {
  trans: string;
  name: string;
  quantity: string;
  discountAmount: string;
  discountPercent: string;
  subTotal: string;
  tax: string;
  total: string;
  share: string;
};

export type RetailDayEndTax = {
  name: string;
  quantity: string;
  rate: string;
  taxable: string;
  tax: string;
  share: string;
};

export type RetailDayEndDetail = {
  employeeName: string;
  departments: RetailDayEndDepartment[];
  departmentTotal: RetailDayEndDepartment;
  summary: RetailDayEndLine[];
  cashStatus: RetailDayEndLine[];
  salesBreakdown: RetailDayEndLine[];
  paidOutTotal: string;
  paidInTotal: string;
  taxes: RetailDayEndTax[];
  taxTotal: RetailDayEndTax;
  cashAcceptors: Array<{
    name: string;
    openingRecycler: string;
    closingRecycler: string;
    openingCashbox: string;
    closingCashbox: string;
  }>;
  employees: Array<{
    name: string;
    clockIn: string;
    clockOut: string;
    total: string;
  }>;
  miscellaneous: Array<{
    terminal: string;
    noSale: string;
    voidCount: string;
    voidAmount: string;
    returnCount: string;
    returnDeposit: string;
    returnTax: string;
    returnAmount: string;
  }>;
  promotions: Array<{
    name: string;
    count: string;
    quantity: string;
    beforeSale: string;
    discount: string;
    afterSale: string;
  }>;
};

/** Sample preview rows for the retail day-end list. Not a live store read. */
export const retailDayEndBatches: RetailDayEndRow[] = [
  {
    id: "5",
    batch: 5,
    startLabel: "Jul-16-2025 07:15:30 PM",
    endLabel: "Jul-16-2025 07:20:21 PM",
    start: new CalendarDate(2025, 7, 16),
    end: new CalendarDate(2025, 7, 16),
    status: "Close",
  },
  {
    id: "4",
    batch: 4,
    startLabel: "Jul-16-2025 03:24:02 PM",
    endLabel: "Jul-16-2025 07:15:08 PM",
    start: new CalendarDate(2025, 7, 16),
    end: new CalendarDate(2025, 7, 16),
    status: "Close",
  },
  {
    id: "3",
    batch: 3,
    startLabel: "Jul-15-2025 03:02:39 PM",
    endLabel: "Jul-16-2025 03:22:57 PM",
    start: new CalendarDate(2025, 7, 15),
    end: new CalendarDate(2025, 7, 16),
    status: "Close",
  },
  {
    id: "2",
    batch: 2,
    startLabel: "Jul-14-2025 02:20:08 PM",
    endLabel: "Jul-15-2025 03:02:22 PM",
    start: new CalendarDate(2025, 7, 14),
    end: new CalendarDate(2025, 7, 15),
    status: "Close",
  },
];

/** Sample day-end detail shared by the preview batches. Not a live store read. */
export const retailDayEndDetail: RetailDayEndDetail = {
  employeeName: "Acute User",
  departments: [
    {
      trans: "2",
      name: "Battery",
      quantity: "1",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "59.99",
      tax: "3.60",
      total: "63.59",
      share: "50.05",
    },
    {
      trans: "1",
      name: "Cleaner",
      quantity: "1",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "56.66",
      tax: "3.40",
      total: "60.06",
      share: "47.27",
    },
    {
      trans: "1",
      name: "Coils-Pods",
      quantity: "1",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "3.22",
      tax: "0.19",
      total: "3.41",
      share: "2.68",
    },
    {
      trans: "0",
      name: "Gift Card",
      quantity: "0",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "0.00",
      tax: "0.00",
      total: "0.00",
      share: "0.00",
    },
  ],
  departmentTotal: {
    trans: "",
    name: "Total",
    quantity: "3",
    discountAmount: "$0.00",
    discountPercent: "0.00",
    subTotal: "$119.87",
    tax: "$7.19",
    total: "$127.06",
    share: "100.00",
  },
  summary: [
    { label: "Net Sales Amount :", value: "$119.87", emphasize: true },
    { label: "Tax Paid :", value: "$7.19", emphasize: true },
    { label: "Gross Sales Amount :", value: "$127.06", emphasize: true },
    { label: "No of Transaction :", value: "#3", emphasize: true },
  ],
  cashStatus: [
    { label: "Opening Balance :", value: "$0.00" },
    { label: "Closing Balance :", value: "$0.00" },
    { label: "Sales Amount :", value: "$0.00" },
    { label: "Paid Out Total :", value: "$0.00" },
    { label: "Paid In Total :", value: "$0.00" },
    { label: "Available Balance :", value: "$0.00", emphasize: true, divider: true },
  ],
  salesBreakdown: [
    { label: "Cash :", value: "0.00" },
    { label: "CreditCard :", value: "0.00" },
    { label: "DebitCard :", value: "0.00" },
    { label: "ExternalPay :", value: "127.06" },
    { label: "Check :", value: "0.00" },
    { label: "Account :", value: "0.00" },
    { label: "FoodStamp :", value: "0.00" },
    { label: "EBT :", value: "0.00" },
    { label: "Voucher :", value: "0.00" },
    { label: "WebOrder :", value: "0.00" },
    { label: "Total :", value: "$119.87", emphasize: true, divider: true },
    { label: "Store Credit :", value: "$0.00" },
    { label: "Gift Card :", value: "$0.00" },
    { label: "Sales Total :", value: "$127.06", emphasize: true, divider: true },
    { label: "Discount :", value: "$0.00" },
    { label: "Deposit :", value: "$0.00" },
  ],
  paidOutTotal: "$0.00",
  paidInTotal: "$0.00",
  taxes: [
    {
      name: "Sales Tax",
      quantity: "3.00",
      rate: "0.00 %",
      taxable: "119.87",
      tax: "$7.19",
      share: "100.00",
    },
  ],
  taxTotal: {
    name: "Total",
    quantity: "3.00",
    rate: "",
    taxable: "",
    tax: "$7.19",
    share: "100.00",
  },
  cashAcceptors: [
    {
      name: "Pospalo2",
      openingRecycler: "0.00",
      closingRecycler: "131.66",
      openingCashbox: "0.00",
      closingCashbox: "0.00",
    },
  ],
  employees: [
    {
      name: "ACUTE Acute",
      clockIn: "2025-07-07 03:44:42",
      clockOut: "2025-07-08 06:01:03",
      total: "28:16:21",
    },
  ],
  miscellaneous: [
    {
      terminal: "W22",
      noSale: "0",
      voidCount: "0",
      voidAmount: "0.00",
      returnCount: "3",
      returnDeposit: "0.00",
      returnTax: "0.00",
      returnAmount: "0.00",
    },
    {
      terminal: "Total",
      noSale: "$0.00",
      voidCount: "0",
      voidAmount: "$0.00",
      returnCount: "0",
      returnDeposit: "0.00",
      returnTax: "$0.00",
      returnAmount: "$0.00",
    },
  ],
  promotions: [
    {
      name: "Total",
      count: "0.00",
      quantity: "0.00",
      beforeSale: "$0.00",
      discount: "$0.00",
      afterSale: "$0.00",
    },
  ],
};
