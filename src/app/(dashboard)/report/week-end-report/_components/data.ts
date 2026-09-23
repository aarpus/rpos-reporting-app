export const summary = [
  ["Net Sales", 2233.79],
  ["Total Tax", 129.64],
  ["Total Discounts", -75.13],
  ["Total Tips", 86],
  ["Total Fees", 94.56],
  ["Gross Sales", 2363.43],
  ["Total Refunds", -371.54],
  ["Total Voids", -23.98],
  ["Payments Received", 2588.18],
] as const;

export const departments = [
  [1, "Beer", 21, 71, 339.53, -5.26, 8.59, 334.27, 30.08, 364.35, 19.02],
  [2, "Beverage", 23, 39, 117, -6.41, 10.47, 110.59, 6.65, 117.24, 6.29],
  [3, "Food", 49, 116, 1078.02, -38.46, 62.8, 1039.56, 62.41, 1101.97, 59.16],
  [4, "Gift Card", 3, 3, 300, 0, 0, 300, 0, 300, 100],
  [5, "Wine", 15, 23, 283.84, -11.11, 18.14, 272.73, 24.56, 297.29, 15.52],
] as const;

export const orderTypes = [
  [1, "DINE-IN", 55, 1700.3],
  [2, "TO-GO", 10, 401.97],
  [3, "DELIVERY", 8, 206.65],
] as const;

export const taxes = [
  [1, "Liquor Tax (9.00%)", 672.92, 60.58],
  [2, "Food Tax (6.00%)", 1067.5, 64.09],
  [3, "Sales Tax (6.00%)", 82.65, 4.97],
] as const;

export const tenders = [
  [1, "Cash", 52, 1781.3, -331.8, -10.09, 1449.5],
  [2, "Gift Card", 7, 123.78, 0, 0, 123.78],
  [3, "External Pay", 11, 217.31, 0, -8.47, 217.31],
  [4, "Card", 25, 837.33, -39.74, -5.42, 797.59],
] as const;

export const tipsFees = [
  [1, "Total Gratuity", 12, 130.12],
  [2, "Non Cash Tips", 8, 53],
  [3, "Cash Tips", 4, 33],
  [4, "Non Cash Tips Withheld", 0, 2.12],
  [5, "Gratuity Withheld", 0, 6.51],
] as const;

export const cashAudit = [
  [1, 1, "Acute POS", 0, 11.7, 0, 0, 11.7, 0, 0, 0, 0, 0, 11.7, 0],
  [2, 1, "Bobby Patel", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 1, "Bobby Patel", 0, 8.5, 0, 0, 8.5, 0, 0, 0, 0, 0, 8.5, 0],
  [4, 1, "Bobby Patel", 0, 44.5, 0, 0, 44.5, 0, 0, 0, 0, 0, 44.5, 0],
  [5, 1, "Swami", 123, 92.2, 10, 0, 225.2, 4, 14, 10, 0, 0.2, 197.96, 27.24],
  [6, 1, "Bobby Patel", 100, 81.3, 0, 0, 181.3, 33.54, 10, 0, 0, 1.68, 139.84, 41.46],
  [7, 1, "Bobby Patel", 0, 55.6, 3, 0, 58.6, 12.97, 9, 3, 0, 0.65, 34.64, 23.96],
  [8, 1, "Bobby Patel", 0, -76.8, 0, 0, -76.8, 0, 0, 0, 0, 0, -76.8, 0],
  [9, 1, "Bobby Patel", 0, 249.7, 10, 0, 259.7, 15.81, 0, 10, 0, 0.79, 234.68, 25.02],
  [10, 1, "Bobby Patel", 0, 262.6, 10, 0, 272.6, 22.74, 0, 10, 0, 1.14, 241, 31.6],
  [11, 2, "Acute POS", 0, 289.1, 0, 0, 289.1, 12, 20, 0, 0, 0.6, 258.5, 30.6],
  [12, 2, "Bobby Patel", 0, 154.5, 0, 0, 154.5, 20.22, 0, 0, 0, 1.01, 135.29, 19.21],
  [13, 2, "Swami", 0, 67.9, 0, 0, 67.9, 8.84, 0, 0, 0, 0.44, 59.5, 8.4],
  [14, 2, "Marco", 0, 23.9, 0, 0, 23.9, 0, 0, 0, 0, 0, 23.9, 0],
  [15, 3, "Bobby Patel", 0, 7.6, 0, 0, 7.6, 0, 0, 0, 0, 0, 7.6, 0],
  [16, 4, "Bobby Patel", 0, 177.2, 0, 0, 177.2, 0, 0, 0, 0, 0, 177.2, 0],
] as const;

export const returnsVoids = [
  [1, "30002", "RETURN", -4.8], [2, "30006", "RETURN", -3.3],
  [3, "30007", "RETURN", -3.8], [4, "30008", "VOID", -1.6],
  [5, "31002", "VOID", -8.5], [6, "31007", "RETURN", -13.77],
  [7, "31008", "RETURN", -25.97], [9, "31009", "RETURN", -23.4],
  [10, "31013", "VOID", -5.42], [11, "31021", "RETURN", -93.2],
  [12, "31022", "RETURN", -203.3],
] as const;

export const discounts = [
  [1, "30004", "Custom Discount", "transc disc", 28.47, -2.85, 25.62],
  [2, "31001", "Food 10% Off", "Transaction Discount", 94.1, -9.41, 84.69],
  [3, "31010", "Custom Discount", "Trns 3", 41.95, -4.2, 37.75],
  [4, "31002", "Food 10% Off", "Transaction Discount", 16.98, -1.7, 15.28],
  [5, "30003", "Custom Discount", "TRANSC DISC", 94.8, -14.22, 80.58],
  [6, "31002", "Custom Discount", "Testing", 44.94, -4.49, 40.45],
  [7, "30002", "Custom Discount", "TRANSC DISC", 25.45, -2.54, 22.91],
  [8, "31007", "Food 10% Off", "Transaction Discount", 59.93, -5.99, 53.94],
  [9, "31001", "Custom Discount", "Trnsaction Dis 1", 64.93, -6.49, 58.44],
  [10, "31008", "Food 10% Off", "Transaction Discount", -19.98, 2, -17.98],
  [11, "31017", "Custom Discount", "TRnsaction Dis", 16.98, -1.7, 15.28],
  [12, "31004", "Food 10% Off", "Discount123", 34.46, -10, 24.46],
  [13, "30001", "Custom Discount", "transc disc", 64.87, -6.49, 58.38],
  [14, "31008", "Custom Discount", "Trnsaction Dis", 36.95, -3.7, 33.25],
  [15, "31009", "Custom Discount", "Trnsaction Dis", -17.98, 1.8, -16.18],
  [16, "30005", "Food 10% Off", "FOOD DISC", 19.97, -2, 17.97],
  [17, "30001", "Custom Discount", "ITEM DISC", 10.99, -0.55, 10.44],
  [18, "30002", "Custom Discount", "ITEM DISC", 11.99, -1.2, 10.79],
  [19, "30004", "Custom Discount", "ITM DISC", 13.99, -1.4, 12.59],
] as const;

export const employees = [
  [1, "Bobby Patel", 42, "Owner", 8, "00:00", "166:02"],
  [2, "Swami", 20, "Owner", 3, "00:00", "53:06"],
  [3, "Acute POS", 10, "System", 3, "00:00", "48:48"],
  [4, "Marco", 1, "Owner", 1, "00:00", "0:12"],
] as const;

export const stock = [
  [1, "Fried Pickles", -9, 6, 0, -9], [2, "Can Soda", 19, 6, 0, 19],
  [3, "Juice", -8, 8, 0, -8], [4, "Chicken Tender", -12, 25, 0, -14],
  [5, "Miller Lite Draft", -24, 5, 0, -24], [6, "Yuengling Draft", -18, 4, 0, -18],
  [7, "Reg Fries", -11, 14, 0, -12], [8, "R. Call", -6, 1, 0, -6],
  [9, "Nachos", -3, 11, 0, -3], [10, "Summer Shandy Draft", -19, 4, 0, -21],
  [11, "14 Hands Merlot", -2, 8, 0, -6], [12, "Seasoned Fries", -10, 9, 0, -10],
  [13, "Spring Water", 17, 3, 0, 17], [14, "Sparkling Water", 20, 8, 0, 20],
] as const;
