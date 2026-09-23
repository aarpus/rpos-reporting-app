export const reportMeta = {
  brand: "AcutePOS",
  title: "Day End Report",
  businessDateLabel: "Thursday, September 10, 2026",
  terminals: "MJ, MS27",
  station: "4",
  batch: "4",
  dayStart: "01:40 PM",
  dayEnd: "02:54 PM",
  printedAt: "2026-09-10 08:12 PM",
  userName: "Marco JACK",
};

export const summaryOverview = [
  { label: "Net Sales", value: 630.39 },
  { label: "Total Tax", value: 48.33 },
  { label: "Total Discounts", value: -55.94 },
  { label: "Total Tips", value: 134.5 },
  { label: "Total Fees", value: 59.04 },
  { label: "Gross Sales", value: 678.72 },
  { label: "Total Refunds", value: -45.72 },
  { label: "Total Voids", value: -80.32 },
  { label: "Payments Received", value: 787.65 },
  { label: "Transactions", value: 31, kind: "count" as const },
  { label: "Total Working Hours", value: "1:47", kind: "text" as const },
];

export const departments = [
  {
    no: 1,
    name: "Beer",
    trans: 13,
    qty: 34,
    amount: 212.52,
    discount: -22.84,
    discountPct: 37.52,
    subtotal: 189.68,
    tax: 17.04,
    total: 206.72,
    salesPct: 30.09,
  },
  {
    no: 2,
    name: "Beverages",
    trans: 5,
    qty: 24,
    amount: 65.53,
    discount: -0.71,
    discountPct: 1.17,
    subtotal: 64.82,
    tax: 3.87,
    total: 68.69,
    salesPct: 10.28,
  },
  {
    no: 3,
    name: "Food",
    trans: 6,
    qty: 16,
    amount: 107.37,
    discount: -10.02,
    discountPct: 16.46,
    subtotal: 97.35,
    tax: 5.84,
    total: 103.19,
    salesPct: 15.44,
  },
  {
    no: 4,
    name: "Gift Card",
    trans: 0,
    qty: 0,
    amount: 0,
    discount: 0,
    discountPct: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
    salesPct: 0,
  },
  {
    no: 5,
    name: "Liquor",
    trans: 9,
    qty: 41,
    amount: 265.85,
    discount: -25.21,
    discountPct: 41.41,
    subtotal: 240.64,
    tax: 21.58,
    total: 262.22,
    salesPct: 38.17,
  },
  {
    no: 6,
    name: "Misc",
    trans: 5,
    qty: 4,
    amount: 40,
    discount: -2.1,
    discountPct: 3.45,
    subtotal: 37.9,
    tax: 0,
    total: 37.9,
    salesPct: 6.01,
  },
];

export const departmentTotal = {
  trans: 38,
  qty: 119,
  amount: 691.27,
  discount: -60.88,
  discountPct: 100,
  subtotal: 630.39,
  tax: 48.33,
  total: 678.72,
  salesPct: 100,
};

export const orderTypes = [
  { no: 1, name: "DINE-IN", count: 17, amount: 330.62 },
  { no: 2, name: "TO-GO", count: 5, amount: 132.59 },
  { no: 3, name: "DELIVERY", count: 5, amount: 228.06 },
];

export const orderTypeTotal = { count: 27, amount: 691.27 };

export const taxes = [
  { no: 1, name: "Liquor Tax (9.00%)", taxable: 430.32, tax: 38.62 },
  { no: 2, name: "No Tax (0.00%)", taxable: 37.9, tax: 0 },
  { no: 3, name: "Sales Tax (6.00%)", taxable: 162.17, tax: 9.71 },
];

export const taxTotal = { taxable: 630.39, tax: 48.33 };

export const tenders = [
  {
    no: 1,
    name: "External Pay",
    count: 6,
    sale: 122.85,
    ret: 0,
    voidAmt: 0,
    net: 122.85,
  },
  {
    no: 2,
    name: "Gift Card",
    count: 4,
    sale: 68.03,
    ret: 0,
    voidAmt: 0,
    net: 68.03,
  },
  {
    no: 3,
    name: "Card",
    count: 11,
    sale: 363.29,
    ret: -4.52,
    voidAmt: 0,
    net: 358.77,
  },
  {
    no: 4,
    name: "Cash",
    count: 16,
    sale: 279.2,
    ret: -41.2,
    voidAmt: -80.32,
    net: 238,
  },
];

export const tenderTotal = {
  count: 37,
  sale: 833.37,
  ret: -45.72,
  voidAmt: -80.32,
  net: 787.65,
};

export const tipsFees = [
  { no: 1, name: "Total Gratuity", count: 14, amount: 49.94 },
  { no: 2, name: "Non Cash Tips", count: 11, amount: 93 },
  { no: 3, name: "Cash Tips", count: 5, amount: 41.5 },
  { no: 4, name: "Non Cash Tips Withheld", count: 0, amount: 0 },
  { no: 5, name: "Gratuity Withheld", count: 0, amount: 0 },
];

export const tipsFeesTotal = { count: 30, amount: 184.44 };

export const cardPayments = [
  { no: 1, name: "VISA", count: 11, sale: 358.77, tip: 60, total: 418.77 },
];

export const cardPaymentTotal = {
  count: 11,
  sale: 358.77,
  tip: 60,
  total: 418.77,
};

export const devices = [
  {
    no: 1,
    name: "Pay@table",
    count: 11,
    cardAmount: 418.77,
    surcharge: 10.9,
    total: 429.67,
  },
];

export const deviceTotal = {
  count: 11,
  cardAmount: 418.77,
  surcharge: 10.9,
  total: 429.67,
};

export const cashAudit = [
  {
    no: 1,
    shift: 1,
    employee: "Mahir",
    open: 0,
    sales: 145.95,
    tip: 10,
    close: 0,
    total: 155.95,
    cashGratuity: 32.55,
    nonCashTip: 60,
    cashTip: 10,
    nonCashTipWithheld: 0,
    gratuityWithheld: 0,
    owedToRest: 53.4,
    received: 102.55,
  },
  {
    no: 2,
    shift: 2,
    employee: "Marco JACK",
    open: 50,
    sales: 92.05,
    tip: 31.5,
    close: 20,
    total: 173.55,
    cashGratuity: 17.39,
    nonCashTip: 219,
    cashTip: 31.5,
    nonCashTipWithheld: 0,
    gratuityWithheld: 0,
    owedToRest: -114.34,
    received: 267.89,
  },
];

export const cashAuditTotal = {
  open: 50,
  sales: 238,
  tip: 41.5,
  close: 20,
  total: 329.5,
  cashGratuity: 49.94,
  nonCashTip: 279,
  cashTip: 41.5,
  nonCashTipWithheld: 0,
  gratuityWithheld: 0,
  owedToRest: -60.94,
  received: 370.44,
};

export const rounding = [
  { label: "# Cash Transactions (16)", amount: 0 },
  { label: "+ve Rounding Adj. Amount (0)", amount: 0.07 },
  { label: "-ve Rounding Adj. Amount (0)", amount: -0.12 },
];

export const roundingTotal = -0.05;

export const externalPayments = [
  { no: 1, type: "Expay", count: 4, amount: 65.33 },
  { no: 2, type: "External Pay", count: 2, amount: 57.52 },
];

export const externalPaymentTotal = { count: 6, amount: 122.85 };

export const giftCardPayments = [
  { no: 1, name: "****6G1", count: 1, amount: 25.9 },
  { no: 2, name: "****M11", count: 1, amount: 4.8 },
  { no: 3, name: "****M12", count: 2, amount: 46.33 },
];

export const giftCardPaymentTotal = { count: 4, amount: 77.03 };

export const voidItems = [
  {
    no: 1,
    reason: "INCORRECT ITEM ORDERED",
    count: 1,
    employee: "Marco JACK",
    shift: 7,
  },
  {
    no: 2,
    reason: "ITEM NOT AVAILABLE",
    count: 1,
    employee: "Marco JACK",
    shift: 7,
  },
];

export const returnsVoids = [
  {
    no: 1,
    check: "2026",
    type: "RETURN",
    tender: "Cash",
    amount: -8,
    by: "Mahir",
    terminal: "MJ",
  },
  {
    no: 2,
    check: "2027",
    type: "RETURN",
    tender: "Cash",
    amount: -22,
    by: "Mahir",
    terminal: "MJ",
  },
  {
    no: 3,
    check: "2032",
    type: "VOID",
    tender: "Cash",
    amount: -17.6,
    by: "Mahir",
    terminal: "MJ",
  },
  {
    no: 4,
    check: "2034",
    type: "VOID",
    tender: "Cash",
    amount: -56.35,
    by: "Mahir",
    terminal: "MJ",
  },
  {
    no: 5,
    check: "3007",
    type: "VOID",
    tender: "Cash",
    amount: -1.7,
    by: "Marco JACK",
    terminal: "MS27",
  },
  {
    no: 6,
    check: "3017",
    type: "RETURN",
    tender: "Creditcard",
    amount: -4.52,
    by: "Marco JACK",
    terminal: "MS27",
  },
  {
    no: 7,
    check: "3019",
    type: "RETURN",
    tender: "Cash",
    amount: -11.2,
    by: "Marco JACK",
    terminal: "MS27",
  },
  {
    no: 8,
    check: "3035",
    type: "VOID",
    tender: "Cash",
    amount: -4.7,
    by: "Marco JACK",
    terminal: "MS27",
  },
];

export const returnsVoidsTotal = -126.07;

export const discounts = [
  {
    no: 1,
    check: "2006",
    name: "Custom Discount",
    reason: "2 Percent dis",
    before: 14.61,
    amount: -0.29,
    after: 14.32,
  },
  {
    no: 2,
    check: "2015",
    name: "Custom Discount",
    reason: "Dis",
    before: 25.71,
    amount: -5.4,
    after: 20.31,
  },
  {
    no: 3,
    check: "3012",
    name: "Custom Discount",
    reason: "transc disc",
    before: 72.21,
    amount: -7.94,
    after: 64.27,
  },
  {
    no: 4,
    check: "2033",
    name: "Custom Discount",
    reason: "Ds discount",
    before: 65.44,
    amount: -13.74,
    after: 51.7,
  },
  {
    no: 5,
    check: "3031",
    name: "Custom Discount",
    reason: "TRANSC DISC",
    before: 40.45,
    amount: -4.45,
    after: 36,
  },
  {
    no: 6,
    check: "2002",
    name: "Custom Discount",
    reason: "Transction level discount",
    before: 11.71,
    amount: -1.41,
    after: 10.3,
  },
  {
    no: 7,
    check: "3019",
    name: "Custom Discount",
    reason: "transc disc",
    before: -10.38,
    amount: 1.14,
    after: -9.24,
  },
  {
    no: 8,
    check: "2004",
    name: "Custom Discount",
    reason: "Tt",
    before: 11.96,
    amount: -0.24,
    after: 11.72,
  },
  {
    no: 9,
    check: "3001",
    name: "Custom Discount",
    reason: "TRANSC DISC",
    before: 57.53,
    amount: -6.33,
    after: 51.2,
  },
  {
    no: 10,
    check: "2014",
    name: "Custom Discount",
    reason: "Dis",
    before: 10.94,
    amount: -0.22,
    after: 10.72,
  },
  {
    no: 11,
    check: "2009",
    name: "Custom Discount",
    reason: "% 5 dis",
    before: 26.88,
    amount: -1.34,
    after: 25.54,
  },
  {
    no: 12,
    check: "3008",
    name: "Custom Discount",
    reason: "transc disc",
    before: 62.47,
    amount: -15.61,
    after: 46.86,
  },
  {
    no: 13,
    check: "2029",
    name: "Custom Discount",
    reason: "Test",
    before: 16.48,
    amount: -1.98,
    after: 14.5,
  },
  {
    no: 14,
    check: "3017",
    name: "Custom Discount",
    reason: "transc disc",
    before: -4.36,
    amount: 1.09,
    after: -3.27,
  },
  {
    no: 15,
    check: "2002",
    name: "Custom Discount",
    reason: "Item level discount",
    before: 3.67,
    amount: -0.37,
    after: 3.3,
  },
  {
    no: 16,
    check: "3001",
    name: "Custom Discount",
    reason: "ITEM DISC",
    before: 10,
    amount: -1,
    after: 9,
  },
  {
    no: 17,
    check: "3008",
    name: "Custom Discount",
    reason: "itm diosc",
    before: 7.28,
    amount: -0.8,
    after: 6.48,
  },
  {
    no: 18,
    check: "3012",
    name: "Custom Discount",
    reason: "item dsic",
    before: 13.65,
    amount: -1.5,
    after: 12.15,
  },
  {
    no: 19,
    check: "3024",
    name: "Custom Discount",
    reason: "ITEM DISC",
    before: 4.47,
    amount: -0.49,
    after: 3.98,
  },
];

export const discountTotal = { before: 440.72, amount: -60.88, after: 379.84 };

export const clockIns = [
  {
    no: 1,
    employee: "Mahir",
    trans: 20,
    role: "Owner",
    clockIn: "10-09-2026 13:40",
    clockOut: "10-09-2026 14:54",
    breakHours: "00:00",
    workHours: "1:13",
    totalSale: 401.43,
  },
  {
    no: 2,
    employee: "Marco JACK",
    trans: 7,
    role: "Owner",
    clockIn: "10-09-2026 14:19",
    clockOut: "10-09-2026 14:53",
    breakHours: "00:00",
    workHours: "0:34",
    totalSale: 228.96,
  },
];

export const clockInTotal = {
  trans: 27,
  breakHours: "00:00",
  workHours: "1:47",
  totalSale: 630.39,
};
