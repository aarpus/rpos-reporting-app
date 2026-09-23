export const summary = [
  ["Net Sales", 9471.36],
  ["Total Tax", 614.03],
  ["Total Discounts", -294.95],
  ["Total Tips", 904.62],
  ["Total Fees", 180.53],
  ["Gross Sales", 10085.39],
  ["Total Refunds", -629.42],
  ["Total Voids", -127.71],
  ["Payments Received", 10632.18],
] as const;

export const departments = [
  [1, "Beer", 254, 596, 2019.06, -34.74, 13.71, 1984.32, 179.03, 2163.35, 27.04],
  [2, "Beverage", 168, 325, 1013.03, -11.51, 4.54, 1001.52, 60.27, 1061.79, 13.65],
  [3, "Food", 227, 417, 4120.59, -188.5, 74.4, 3932.09, 240.7, 4172.79, 53.59],
  [4, "Gift Card", 11, 12, 850.5, -32.5, 100, 818, 0, 818, 100],
  [5, "Wine", 25, 37, 438.46, -18.61, 7.35, 419.85, 37.78, 457.63, 5.72],
] as const;

export const orderTypes = [
  [1, "DINE-IN", 399, 7792.71],
  [2, "TO-GO", 77, 1432.74],
  [3, "DELIVERY", 24, 576.37],
  [4, "RETURN", 2, -17.98],
] as const;

export const taxes = [
  [1, "Liquor Tax (9.00%)", 3481.51, 312.71],
  [2, "Food Tax (6.00%)", 4130.54, 251.19],
  [3, "Sales Tax (6.00%)", 805.73, 48.48],
] as const;

export const tenders = [
  [1, "Cash", 358, 6021.02, -552.45, -154.59, 5468.57],
  [2, "External Pay", 68, 1255.58, -6.53, -8.47, 1249.05],
  [3, "Gift Card", 36, 508.71, 0, 0, 508.71],
  [4, "Card", 136, 3476.29, -70.44, -29.89, 3405.85],
] as const;

export const tipsFees = [
  [1, "Total Gratuity", 61, 402.37],
  [2, "Non Cash Tips", 101, 610.62],
  [3, "Cash Tips", 43, 299],
  [4, "Non Cash Tips Withheld", 0, 24.42],
  [5, "Gratuity Withheld", 0, 20.12],
] as const;

export const cardPayments = [
  [1, "AMEX", 1, 55.24, 11.05, 66.29],
  [2, "VISA", 120, 2895.5, 347.43, 3242.93],
  [3, "DISCOVER", 1, 13.08, 5, 18.08],
  [4, "MASTERCARD", 13, 437.81, 48.15, 485.96],
] as const;

export const devices = [
  [1, "Pay@table", 65, 1675.65, 48.31, 1723.96],
  [2, "Vp350", 71, 2141.83, 0, 2141.83],
] as const;

// Representative audit rows from the reference. The exact annual totals are
// rendered below the table, matching the source report.
export const cashAudit = [
  [1, 1, "Swami", 0, 0, 0, 0, 0, 0, 2.19, 0, 0, 0, -2.1, 2.1],
  [2, 1, "Amy LONG", 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, -2.88, 2.88],
  [3, 1, "Swami", 0, 5.4, 0, 0, 5.4, 0, 0, 0, 0, 0, 5.4, 0],
  [4, 1, "Acute POS", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [8, 1, "Amy LONG", 0, 0, 0, 0, 0, 0, 25, 0, 0, 0, -24, 24],
  [9, 1, "Swami", 0, 23.3, 0, 0, 23.3, 0, 4.3, 0, 0, 0, 19.17, 4.13],
  [10, 1, "Swami", 0, 54.55, 0, 0, 54.55, 0, 12, 0, 0, 0, 43.03, 11.52],
  [12, 1, "Amy LONG", 0, 22.35, 0, 0, 22.35, 0, 10, 0, 0, 0, 12.75, 9.6],
  [18, 1, "Swami", 0, 15.8, 0, 0, 15.8, 0, 10.43, 0, 0, 0, 5.79, 10.01],
  [30, 1, "Amy LONG", 0, 0, 0, 0, 0, 0, 2.79, 0, 0, 0, -2.68, 2.68],
  [62, 1, "Bobby Patel", 25, 32.95, 25, 0, 82.95, 4.87, 0, 25, 0, 0.24, 53.32, 29.63],
  [64, 1, "Swami", 123, 92.2, 10, 0, 225.2, 4, 14, 10, 0, 0.2, 197.96, 27.24],
  [68, 1, "Bobby Patel", 100, 81.3, 0, 0, 181.3, 33.54, 10, 0, 0, 1.68, 139.84, 41.46],
  [73, 1, "Marco", 0, 97.1, 12, 0, 109.1, 15.56, 5, 12, 0, 0.78, 77.52, 31.58],
  [234, 2, "Swami", 0, 255.65, 0, 0, 255.65, 7.76, 0, 0, 0, 0.39, 248.28, 7.37],
  [236, 2, "Acute POS", 0, 289.1, 0, 0, 289.1, 12, 20, 0, 0, 0.6, 258.5, 30.6],
  [241, 2, "Bobby Patel", 0, 25.95, 16, 0, 41.95, 12.79, 19.5, 16, 0, 0.64, -4.92, 46.87],
  [243, 2, "Bobby Patel", 50, 133.25, 23.5, 0, 206.75, 31.8, 36, 23.5, 0, 1.59, 118.48, 88.27],
  [255, 2, "Bobby Patel", 50, 76.4, 14, 0, 140.4, 14.84, 0, 14, 0, 0.74, 112.3, 28.1],
  [282, 4, "Bobby Patel", 0, 177.2, 0, 0, 177.2, 0, 0, 0, 0, 0, 177.2, 0],
] as const;

export const externalPayments = [
  [1, "Credit/debit Card", 31, 548.36],
  [2, "Expay", 24, 393.97],
  [3, "External Pay", 15, 317.2],
] as const;

export const voidReasons = [
  [1, "TEST", 1], [2, "CUSTOME IS NOT HAPPY", 1], [3, "CUSTOMER MIND CHANGE", 2],
  [4, "CUSTOMER REQUESTED REMOVAL", 1], [5, "DUPLICATE ITEM", 1],
  [6, "END HAPPY HOUR", 1], [7, "END HAPPY HOUR", 2], [8, "INCORRECT ORDER", 7],
  [9, "JB", 1], [10, "MAGARITA", 1], [11, "MAGARITA MIX", 1], [12, "MORE TAB", 1],
  [13, "MTEST", 1], [14, "NEXT TABLE", 2], [15, "NOT INTERSTED", 3], [16, "NOT NEED", 3],
  [17, "NOT NEEDING", 1], [18, "NOTE", 1], [19, "NTEST", 1], [20, "ORENG", 1],
  [21, "ORNGE CRUCH", 1], [22, "OTHER REASON", 1], [23, "OUT OF STOCK", 10],
  [24, "OUT OF STUCK", 1], [25, "TEST", 19], [26, "TEST TRANSACTION", 1],
  [27, "TESTING", 1], [28, "TST", 2], [29, "VOID REASON SEND REQUEST", 1],
  [30, "WORN PRICE", 1], [31, "WORNG", 1], [32, "WRONG ITM", 1],
  [33, "WRONG MODIFIER SELECTED", 1], [34, "WRONG QUANTITY", 5], [35, "WRONM ITM", 1],
] as const;

export const returnsVoids = [
  [2, "25002", "RETURN", -31.7], [5, "25003", "RETURN", -6.53],
  [6, "25004", "RETURN", -12.7], [7, "25005", "RETURN", -19.6],
  [8, "25006", "RETURN", -3.25], [9, "26002", "VOID", -1.9],
  [10, "26003", "VOID", -1.9], [11, "26013", "VOID", -3.8],
  [13, "26016", "VOID", -0.7], [14, "26017", "VOID", -3.8],
  [15, "26025", "RETURN", -3.3], [16, "26026", "VOID", -4.5],
  [17, "26034", "RETURN", -2.55], [18, "26035", "VOID", -2.85],
  [19, "27011", "RETURN", -3.7], [20, "27013", "RETURN", -22.2],
  [21, "27014", "VOID", -13.1], [22, "27021", "VOID", -4.35],
  [23, "27022", "RETURN", -6.5], [25, "27024", "RETURN", -5.8],
  [26, "27025", "VOID", -30.9], [27, "27031", "RETURN", -7.6],
  [28, "27033", "VOID", -4.2], [30, "30002", "RETURN", -4],
  [31, "30004", "VOID", -1.3], [32, "30005", "RETURN", -1.3],
  [33, "30006", "RETURN", -3.3], [34, "30007", "RETURN", -3.8],
  [36, "30008", "VOID", -1.6], [37, "30009", "VOID", -2.1],
  [38, "30021", "RETURN", -3.3], [39, "30022", "VOID", -2.95],
  [41, "30026", "VOID", -18.85], [43, "31002", "VOID", -8.47],
  [44, "31005", "RETURN", -30.7], [46, "31007", "VOID", -11.65],
  [47, "31008", "RETURN", -25.97], [49, "31009", "RETURN", -23.4],
  [50, "31013", "VOID", -5.42], [51, "31021", "RETURN", -93.2],
  [52, "31022", "RETURN", -203.3], [53, "32002", "RETURN", -19],
] as const;

export const discounts = [
  [1, "30021", "Custom Discount", "transc disc", -2.99, 0.45, -2.54],
  [2, "30004", "Custom Discount", "transc disc", 28.47, -2.85, 25.62],
  [6, "31001", "Food 10% Off", "Transaction Discount", 120.07, -12.01, 108.06],
  [7, "26002", "Custom Discount", "TRANSC DISC", 48.82, -8.86, 39.96],
  [12, "31010", "Custom Discount", "Trns 3", 41.95, -4.2, 37.75],
  [13, "31002", "Food 10% Off", "Transaction Discount", 16.98, -1.7, 15.28],
  [14, "30003", "Custom Discount", "TRANSC DISC", 94.8, -14.22, 80.58],
  [18, "31002", "Custom Discount", "Testing", 44.94, -4.49, 40.45],
  [23, "31007", "Food 10% Off", "Transaction Discount", 59.93, -5.99, 53.94],
  [32, "31008", "Food 10% Off", "Transaction Discount", -19.98, 2, -17.98],
  [43, "31004", "Food 10% Off", "Discount123", 34.46, -10, 24.46],
  [53, "31009", "Custom Discount", "Trnsaction Dis", -17.98, 1.8, -16.18],
  [58, "26002", "Custom Discount", "transc disc", 83.93, -20.98, 62.95],
  [66, "27002", "Custom Discount", "New item level discount", 2.49, -0.05, 2.44],
  [78, "30003", "Custom Discount", "Item disc", 29.98, -3, 26.98],
  [79, "30004", "Custom Discount", "ITM DISC", 27.98, -2.8, 25.18],
  [80, "30007", "Custom Discount", "Item disc", 21.98, -2.2, 19.78],
  [81, "30008", "Custom Discount", "Item disc", 44.97, -4.5, 40.47],
  [82, "30009", "Custom Discount", "Item disc", 14.99, -1.5, 13.49],
  [83, "30010", "Custom Discount", "ITEM DISC", 13.99, -1.4, 12.59],
  [84, "30013", "Custom Discount", "Itm disc", 11.99, -3, 8.99],
  [85, "30026", "Custom Discount", "itm disc", 15, -3.75, 11.25],
  [86, "30027", "Custom Discount", "itm disc", 12.99, -1.3, 11.69],
] as const;

export const employees = [
  [1, "Bobby Patel", 81, "Owner", 173, "00:00", "4124:17"],
  [2, "Swami", 262, "Owner", 172, "00:18", "4101:55"],
  [3, "Acute POS", 31, "System", 133, "00:00", "3174:21"],
  [4, "Amy LONG", 66, "Staff", 86, "00:00", "2045:24"],
  [5, "Marco", 38, "Owner", 16, "00:07", "357:57"],
] as const;

export const stock = [
  [1, "Fried Pickles", -2, 26, 0, -2], [2, "Can Soda", 36, 76, 0, 36],
  [3, "Juice", -2, 48, 0, -2], [4, "Chicken Tender", -4, 63, 0, -4],
  [5, "Nachos", 0, 19, 0, 0], [6, "Yuengling Draft", -8, 34, 0, -8],
  [7, "R. Call", -4, 17, 0, -4], [8, "Reg Fries", -6, 50, 0, -6],
  [9, "Miller Lite Draft", -1, 36, 0, -1], [10, "Summer Shandy Draft", -6, 32, 0, -6],
  [11, "Sparkling Water", 23, 55, 0, 23], [12, "14 Hands Merlot", -2, 10, 0, -6],
  [13, "Spring Water", 22, 17, 0, 22], [14, "Seasoned Fries", -4, 30, 0, -4],
] as const;
