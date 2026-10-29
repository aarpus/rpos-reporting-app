export type RetailWeekEndLine = {
  label: string;
  value: string;
  emphasize?: boolean;
  divider?: boolean;
};

export type RetailWeekEndDepartment = {
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

export type RetailWeekEndTax = {
  name: string;
  quantity: string;
  rate: string;
  taxable: string;
  tax: string;
  share: string;
};

export type RetailWeekEndDetail = {
  employeeName: string;
  titleRange: string;
  departments: RetailWeekEndDepartment[];
  departmentTotal: RetailWeekEndDepartment;
  summary: RetailWeekEndLine[];
  salesBreakdown: RetailWeekEndLine[];
  taxes: RetailWeekEndTax[];
  taxTotal: RetailWeekEndTax;
};

/** Preview week ids that return sample data. Not a live store read. */
export const RETAIL_WEEK_END_PREVIEW_WEEK_ID = "2025-07-07";

/** Sample week-end detail for July Week-2 (Jul 7–13, 2025). Not a live store read. */
export const retailWeekEndDetail: RetailWeekEndDetail = {
  employeeName: "Acute User",
  titleRange: "JUL-07-2025 TO JUL-13-2025",
  departments: [
    {
      trans: "1",
      name: "Battery",
      quantity: "1",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "59.99",
      tax: "3.60",
      total: "63.59",
      share: "42.89",
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
      share: "40.51",
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
      share: "2.30",
    },
    {
      trans: "1",
      name: "Hookah-Tobacco",
      quantity: "1",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "19.99",
      tax: "1.20",
      total: "21.19",
      share: "14.29",
    },
    {
      trans: "0",
      name: "GiftCard",
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
    quantity: "4",
    discountAmount: "$0.00",
    discountPercent: "0.00",
    subTotal: "$139.86",
    tax: "$8.39",
    total: "$148.25",
    share: "100.00",
  },
  summary: [
    { label: "Net Sales Amount :", value: "$139.86", emphasize: true },
    { label: "Tax Paid :", value: "$8.39", emphasize: true },
    { label: "Gross Sales Amount :", value: "$148.25", emphasize: true },
    { label: "No of Transaction :", value: "#4", emphasize: true },
  ],
  salesBreakdown: [
    { label: "Cash :", value: "0.00" },
    { label: "Card :", value: "132.06" },
    { label: "Check :", value: "16.19" },
    { label: "Account :", value: "0.00" },
    { label: "Papodw2 :", value: "0.00" },
    { label: "Total :", value: "$148.25", emphasize: true, divider: true },
    { label: "Store Credit :", value: "$0.00" },
    { label: "Gift Card :", value: "$0.00" },
    { label: "Total :", value: "$148.25", emphasize: true, divider: true },
    { label: "Deposit :", value: "$0.00" },
  ],
  taxes: [
    {
      name: "Sales Tax",
      quantity: "4.00",
      rate: "6.00 %",
      taxable: "139.86",
      tax: "$8.39",
      share: "100.00",
    },
  ],
  taxTotal: {
    name: "Total",
    quantity: "4.00",
    rate: "",
    taxable: "",
    tax: "$8.39",
    share: "100.00",
  },
};

export function retailWeekEndDetailForWeek(weekId: string): RetailWeekEndDetail | null {
  if (weekId === RETAIL_WEEK_END_PREVIEW_WEEK_ID) return retailWeekEndDetail;
  return null;
}
