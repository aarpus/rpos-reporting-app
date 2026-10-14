export type TransactionRow = {
  id: string;
  checkNo: string;
  createdAt: string;
  subtotal: string;
  tax: string;
  discount: string;
  gratuity: string;
  fees: string;
  tips: string;
  total: string;
  paidBy: string;
  terminal: string;
  cashier: string;
  transType: string;
};

export type TransactionDetail = TransactionRow & {
  items: { name: string; sku: string; qty: string; amount: string; id: string }[];
  payments: { method: string; amount: string; id: string }[];
};

export type TransactionReport = {
  storeCode: string;
  timezone: string;
  rows: TransactionRow[];
  count: number;
  totals: { sales: string; refunds: string; average: string; tips: string; gratuity: string; fees: string };
  options: { tenders: string[]; departments: { id: string; label: string }[]; statuses: string[] };
  detail: TransactionDetail | null;
};
