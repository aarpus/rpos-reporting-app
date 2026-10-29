export type RetailMonthlySalesTaxRow = {
  date: string;
  totalSales: string;
  netSales: string;
  totalTax: string;
  depositAmount: string;
  cash: string;
  cheque: string;
  card: string;
  account: string;
  storeCredit: string;
  giftcard: string;
  salesTaxTaxable: string;
  salesTaxAmt: string;
  lequerTaxTaxable: string;
  lequerTaxAmt: string;
  cgstTaxable: string;
  cgstTaxAmt: string;
  noTaxTaxable: string;
  norfolkTaxable: string;
  norfolkTaxAmt: string;
  emphasize?: boolean;
};

export type RetailMonthlySalesTaxDetail = {
  employeeName: string;
  rows: RetailMonthlySalesTaxRow[];
};

/** Preview month id (YYYY-MM) that returns sample data. Not a live store read. */
export const RETAIL_MONTHLY_SALES_TAX_PREVIEW_ID = "2025-07";

/** Sample monthly sales and tax rows for July 2025. Not a live store read. */
export const retailMonthlySalesTaxDetail: RetailMonthlySalesTaxDetail = {
  employeeName: "Acute User",
  rows: [
    {
      date: "07/01/2025",
      totalSales: "148.25",
      netSales: "139.86",
      totalTax: "8.39",
      depositAmount: "0.00",
      cash: "0.00",
      cheque: "16.19",
      card: "132.06",
      account: "0.00",
      storeCredit: "0.00",
      giftcard: "0.00",
      salesTaxTaxable: "139.86",
      salesTaxAmt: "8.39",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "0.00",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
    },
    {
      date: "07/03/2025",
      totalSales: "210.53",
      netSales: "198.61",
      totalTax: "11.92",
      depositAmount: "0.00",
      cash: "45.00",
      cheque: "0.00",
      card: "165.53",
      account: "0.00",
      storeCredit: "0.00",
      giftcard: "0.00",
      salesTaxTaxable: "198.61",
      salesTaxAmt: "11.92",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "0.00",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
    },
    {
      date: "07/08/2025",
      totalSales: "95.40",
      netSales: "90.00",
      totalTax: "5.40",
      depositAmount: "10.00",
      cash: "20.00",
      cheque: "0.00",
      card: "65.40",
      account: "0.00",
      storeCredit: "0.00",
      giftcard: "0.00",
      salesTaxTaxable: "90.00",
      salesTaxAmt: "5.40",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "0.00",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
    },
    {
      date: "07/12/2025",
      totalSales: "327.18",
      netSales: "308.66",
      totalTax: "18.52",
      depositAmount: "0.00",
      cash: "50.00",
      cheque: "25.00",
      card: "252.18",
      account: "0.00",
      storeCredit: "0.00",
      giftcard: "0.00",
      salesTaxTaxable: "308.66",
      salesTaxAmt: "18.52",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "0.00",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
    },
    {
      date: "07/16/2025",
      totalSales: "127.06",
      netSales: "119.87",
      totalTax: "7.19",
      depositAmount: "0.00",
      cash: "0.00",
      cheque: "0.00",
      card: "0.00",
      account: "0.00",
      storeCredit: "0.00",
      giftcard: "0.00",
      salesTaxTaxable: "119.87",
      salesTaxAmt: "7.19",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "0.00",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
    },
    {
      date: "07/21/2025",
      totalSales: "412.80",
      netSales: "389.43",
      totalTax: "23.37",
      depositAmount: "5.00",
      cash: "80.50",
      cheque: "0.00",
      card: "312.30",
      account: "0.00",
      storeCredit: "10.00",
      giftcard: "0.00",
      salesTaxTaxable: "389.43",
      salesTaxAmt: "23.37",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "0.00",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
    },
    {
      date: "07/25/2025",
      totalSales: "188.51",
      netSales: "177.84",
      totalTax: "10.67",
      depositAmount: "0.00",
      cash: "30.00",
      cheque: "18.00",
      card: "140.51",
      account: "0.00",
      storeCredit: "0.00",
      giftcard: "0.00",
      salesTaxTaxable: "177.84",
      salesTaxAmt: "10.67",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "0.00",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
    },
    {
      date: "07/29/2025",
      totalSales: "143.00",
      netSales: "138.27",
      totalTax: "4.73",
      depositAmount: "5.00",
      cash: "20.00",
      cheque: "21.00",
      card: "82.00",
      account: "0.00",
      storeCredit: "7.98",
      giftcard: "12.02",
      salesTaxTaxable: "78.83",
      salesTaxAmt: "4.73",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "59.44",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
    },
    {
      date: "GiftCard",
      totalSales: "42.38",
      netSales: "42.38",
      totalTax: "0.00",
      depositAmount: "0.00",
      cash: "0.00",
      cheque: "0.00",
      card: "0.00",
      account: "0.00",
      storeCredit: "0.00",
      giftcard: "42.38",
      salesTaxTaxable: "0.00",
      salesTaxAmt: "0.00",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "42.38",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
      emphasize: true,
    },
    {
      date: "Total",
      totalSales: "1,695.11",
      netSales: "1,604.92",
      totalTax: "90.19",
      depositAmount: "20.00",
      cash: "245.50",
      cheque: "80.19",
      card: "1,149.98",
      account: "0.00",
      storeCredit: "17.98",
      giftcard: "54.40",
      salesTaxTaxable: "1,503.10",
      salesTaxAmt: "90.19",
      lequerTaxTaxable: "0.00",
      lequerTaxAmt: "0.00",
      cgstTaxable: "0.00",
      cgstTaxAmt: "0.00",
      noTaxTaxable: "101.82",
      norfolkTaxable: "0.00",
      norfolkTaxAmt: "0.00",
      emphasize: true,
    },
  ],
};

export function retailMonthlySalesTaxForMonth(
  monthId: string,
): RetailMonthlySalesTaxDetail | null {
  if (monthId === RETAIL_MONTHLY_SALES_TAX_PREVIEW_ID) {
    return retailMonthlySalesTaxDetail;
  }
  return null;
}
