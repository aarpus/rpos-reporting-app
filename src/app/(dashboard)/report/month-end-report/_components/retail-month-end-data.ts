export type RetailMonthEndLine = {
  label: string;
  value: string;
  emphasize?: boolean;
  divider?: boolean;
};

export type RetailMonthEndDepartment = {
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

export type RetailMonthEndTax = {
  name: string;
  quantity: string;
  rate: string;
  taxable: string;
  tax: string;
  share: string;
};

export type RetailMonthEndDetail = {
  employeeName: string;
  titleRange: string;
  departments: RetailMonthEndDepartment[];
  departmentTotal: RetailMonthEndDepartment;
  summary: RetailMonthEndLine[];
  salesBreakdown: RetailMonthEndLine[];
  taxes: RetailMonthEndTax[];
  taxTotal: RetailMonthEndTax;
};

/** Preview month id (YYYY-MM) that returns sample data. Not a live store read. */
export const RETAIL_MONTH_END_PREVIEW_ID = "2025-07";

/** Sample month-end detail for July 2025. Not a live store read. */
export const retailMonthEndDetail: RetailMonthEndDetail = {
  employeeName: "Acute User",
  titleRange: "JULY - 2025",
  departments: [
    {
      trans: "2",
      name: "Air Freshner",
      quantity: "2",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "18.98",
      tax: "1.14",
      total: "20.12",
      share: "1.22",
    },
    {
      trans: "5",
      name: "Battery",
      quantity: "6",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "179.94",
      tax: "10.80",
      total: "190.74",
      share: "11.54",
    },
    {
      trans: "3",
      name: "Cleaner",
      quantity: "3",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "169.98",
      tax: "10.20",
      total: "180.18",
      share: "10.90",
    },
    {
      trans: "4",
      name: "Coils-Pods",
      quantity: "5",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "64.95",
      tax: "3.90",
      total: "68.85",
      share: "4.17",
    },
    {
      trans: "6",
      name: "E-Juice",
      quantity: "8",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "239.92",
      tax: "14.40",
      total: "254.32",
      share: "15.39",
    },
    {
      trans: "1",
      name: "Glass",
      quantity: "1",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "45.00",
      tax: "2.70",
      total: "47.70",
      share: "2.89",
    },
    {
      trans: "4",
      name: "Hookah-Tobacco",
      quantity: "5",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "199.95",
      tax: "12.00",
      total: "211.95",
      share: "12.82",
    },
    {
      trans: "2",
      name: "Lighter",
      quantity: "3",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "14.97",
      tax: "0.90",
      total: "15.87",
      share: "0.96",
    },
    {
      trans: "3",
      name: "Misc",
      quantity: "3",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "59.97",
      tax: "3.60",
      total: "63.57",
      share: "3.85",
    },
    {
      trans: "2",
      name: "Paper",
      quantity: "2",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "9.98",
      tax: "0.60",
      total: "10.58",
      share: "0.64",
    },
    {
      trans: "5",
      name: "Tobacco",
      quantity: "4",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "319.96",
      tax: "19.20",
      total: "339.16",
      share: "20.52",
    },
    {
      trans: "3",
      name: "Vape",
      quantity: "2",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "199.98",
      tax: "10.55",
      total: "210.53",
      share: "12.74",
    },
    {
      trans: "2",
      name: "GiftCard",
      quantity: "1",
      discountAmount: "0.00",
      discountPercent: "0.00",
      subTotal: "38.96",
      tax: "0.20",
      total: "39.16",
      share: "2.37",
    },
  ],
  departmentTotal: {
    trans: "",
    name: "Total",
    quantity: "45",
    discountAmount: "$0.00",
    discountPercent: "0.00",
    subTotal: "$1,562.54",
    tax: "$90.19",
    total: "$1,652.73",
    share: "100.00",
  },
  summary: [
    { label: "Net Sales Amount :", value: "$1,562.54", emphasize: true },
    { label: "Tax Paid :", value: "$90.19", emphasize: true },
    { label: "Gross Sales Amount :", value: "$1,652.73", emphasize: true },
    { label: "No of Transaction :", value: "#36", emphasize: true },
  ],
  salesBreakdown: [
    { label: "Cash :", value: "245.50" },
    { label: "Card :", value: "1,286.68" },
    { label: "Check :", value: "80.19" },
    { label: "Account :", value: "0.00" },
    { label: "Papodw2 :", value: "0.00" },
    { label: "Total :", value: "$1,612.37", emphasize: true, divider: true },
    { label: "Store Credit :", value: "$17.98" },
    { label: "Gift Card :", value: "$42.38" },
    { label: "Total :", value: "$1,672.73", emphasize: true, divider: true },
    { label: "Deposit :", value: "$20.00" },
  ],
  taxes: [
    {
      name: "No Tax",
      quantity: "1.00",
      rate: "0.00 %",
      taxable: "59.37",
      tax: "$0.00",
      share: "3.80",
    },
    {
      name: "Sales Tax",
      quantity: "44.00",
      rate: "6.00 %",
      taxable: "1,503.17",
      tax: "$90.19",
      share: "96.20",
    },
  ],
  taxTotal: {
    name: "Total",
    quantity: "45.00",
    rate: "",
    taxable: "",
    tax: "$90.19",
    share: "100.00",
  },
};

export function retailMonthEndDetailForMonth(
  monthId: string,
): RetailMonthEndDetail | null {
  if (monthId === RETAIL_MONTH_END_PREVIEW_ID) return retailMonthEndDetail;
  return null;
}
