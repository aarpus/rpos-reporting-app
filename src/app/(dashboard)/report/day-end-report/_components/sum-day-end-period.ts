import type {
  RetailDayEndDepartment,
  RetailDayEndLine,
  RetailDayEndTax,
} from "./retail-day-end-data";

type Amount = { signed: bigint; scale: number };

export type PeriodBatch = {
  department_sales: { rows: RetailDayEndDepartment[] };
  sales_summary: RetailDayEndLine[];
  sales_breakdown: RetailDayEndLine[];
  tax_detail: { rows: RetailDayEndTax[] };
};

export type PeriodSummary = {
  departments: RetailDayEndDepartment[];
  departmentTotal: RetailDayEndDepartment | null;
  summary: RetailDayEndLine[];
  salesBreakdown: RetailDayEndLine[];
  taxes: RetailDayEndTax[];
  taxTotal: RetailDayEndTax | null;
};

const summaryLabels = ["Net Sales Amount", "Tax Paid", "Gross Sales Amount", "No of Transaction"] as const;
const zero = BigInt(0);
const two = BigInt(2);
const ten = BigInt(10);
const tenThousand = BigInt(10000);

function parseAmount(raw: string): Amount {
  const cleaned = raw.trim().replace(/[$,]/g, "").replace(/%$/, "");
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(cleaned);
  if (!match) return { signed: zero, scale: 0 };
  const fraction = match[3] ?? "";
  const digits = BigInt(`${match[2]}${fraction}`);
  return { signed: match[1] === "-" ? -digits : digits, scale: fraction.length };
}

function formatAmount(signed: bigint, scale: number) {
  const negative = signed < zero;
  const digits = (negative ? -signed : signed).toString().padStart(scale + 1, "0");
  if (scale === 0) return `${negative && digits !== "0" ? "-" : ""}${digits}`;
  const whole = digits.slice(0, -scale);
  const fraction = digits.slice(-scale);
  const zeroAmount = whole === "0" && /^0+$/.test(fraction);
  return `${negative && !zeroAmount ? "-" : ""}${whole}.${fraction}`;
}

export function addAmounts(values: string[]) {
  const parts = values.map(parseAmount);
  const scale = parts.reduce((max, part) => Math.max(max, part.scale), 0);
  let total = zero;
  for (const part of parts) total += part.signed * ten ** BigInt(scale - part.scale);
  return formatAmount(total, scale);
}

function scaleTo(amount: Amount, scale: number) {
  return amount.signed * ten ** BigInt(scale - amount.scale);
}

function divideRound(numerator: bigint, denominator: bigint) {
  if (denominator === zero) return zero;
  const negative = (numerator < zero) !== (denominator < zero);
  const n = numerator < zero ? -numerator : numerator;
  const d = denominator < zero ? -denominator : denominator;
  const quotient = (n + d / two) / d;
  return negative ? -quotient : quotient;
}

function percent(part: string, whole: string) {
  const left = parseAmount(part);
  const right = parseAmount(whole);
  const scale = Math.max(left.scale, right.scale);
  const wholeScaled = scaleTo(right, scale);
  if (wholeScaled === zero) return formatAmount(zero, 2);
  return formatAmount(divideRound(scaleTo(left, scale) * tenThousand, wholeScaled), 2);
}

function labelKey(label: string) {
  return label.replace(/[:\s]+$/g, "").trim().toLowerCase();
}

function isTotal(name: string) {
  return name.trim().toLowerCase() === "total";
}

function sumLines(groups: RetailDayEndLine[][], labels?: readonly string[]) {
  const order: string[] = [];
  const values = new Map<string, string[]>();
  const display = new Map<string, string>();
  for (const lines of groups) {
    for (const line of lines) {
      const key = labelKey(line.label);
      if (!key || (labels && !labels.some((label) => labelKey(label) === key))) continue;
      if (!values.has(key)) {
        order.push(key);
        values.set(key, []);
        display.set(key, labels?.find((label) => labelKey(label) === key) ?? line.label.trim());
      }
      values.get(key)?.push(line.value);
    }
  }
  const keys = labels ? labels.map((label) => labelKey(label)) : order;
  return keys.map((key) => ({
    label: display.get(key) ?? labels?.find((label) => labelKey(label) === key) ?? key,
    value: addAmounts(values.get(key) ?? ["0"]),
  }));
}

export function sumDayEndPeriod(batches: PeriodBatch[]): PeriodSummary {
  const departments = new Map<string, RetailDayEndDepartment[]>();
  for (const batch of batches) {
    for (const row of batch.department_sales.rows) {
      if (isTotal(row.name)) continue;
      const key = row.name.trim().toLowerCase();
      const group = departments.get(key) ?? [];
      group.push(row);
      departments.set(key, group);
    }
  }
  const departmentRows = [...departments.values()].map((rows) => {
    const summed: RetailDayEndDepartment = {
      trans: addAmounts(rows.map((row) => row.trans)),
      name: rows[0]?.name ?? "",
      quantity: addAmounts(rows.map((row) => row.quantity)),
      discountAmount: addAmounts(rows.map((row) => row.discountAmount)),
      discountPercent: "0.00",
      subTotal: addAmounts(rows.map((row) => row.subTotal)),
      tax: addAmounts(rows.map((row) => row.tax)),
      total: addAmounts(rows.map((row) => row.total)),
      share: "0.00",
    };
    summed.discountPercent = percent(summed.discountAmount, addAmounts([summed.subTotal, summed.discountAmount]));
    return summed;
  });
  const departmentGross = addAmounts(departmentRows.map((row) => row.total));
  for (const row of departmentRows) row.share = percent(row.total, departmentGross);
  const departmentTotal = departmentRows.length
    ? {
        trans: "",
        name: "Total",
        quantity: addAmounts(departmentRows.map((row) => row.quantity)),
        discountAmount: addAmounts(departmentRows.map((row) => row.discountAmount)),
        discountPercent: percent(
          addAmounts(departmentRows.map((row) => row.discountAmount)),
          addAmounts([
            addAmounts(departmentRows.map((row) => row.subTotal)),
            addAmounts(departmentRows.map((row) => row.discountAmount)),
          ]),
        ),
        subTotal: addAmounts(departmentRows.map((row) => row.subTotal)),
        tax: addAmounts(departmentRows.map((row) => row.tax)),
        total: departmentGross,
        share: percent(departmentGross, departmentGross),
      }
    : null;

  const taxes = new Map<string, RetailDayEndTax[]>();
  for (const batch of batches) {
    for (const row of batch.tax_detail.rows) {
      if (isTotal(row.name)) continue;
      const key = row.name.trim().toLowerCase();
      const group = taxes.get(key) ?? [];
      group.push(row);
      taxes.set(key, group);
    }
  }
  const taxRows = [...taxes.values()].map((rows) => {
    const rates = [...new Set(rows.map((row) => row.rate.trim()).filter(Boolean))];
    return {
      name: rows[0]?.name ?? "",
      quantity: addAmounts(rows.map((row) => row.quantity)),
      rate: rates.length === 1 ? rates[0] : "",
      taxable: addAmounts(rows.map((row) => row.taxable)),
      tax: addAmounts(rows.map((row) => row.tax)),
      share: "0.00",
    };
  });
  const taxGross = addAmounts(taxRows.map((row) => row.tax));
  for (const row of taxRows) row.share = percent(row.tax, taxGross);
  const taxTotal = taxRows.length
    ? {
        name: "Total",
        quantity: addAmounts(taxRows.map((row) => row.quantity)),
        rate: "",
        taxable: addAmounts(taxRows.map((row) => row.taxable)),
        tax: taxGross,
        share: percent(taxGross, taxGross),
      }
    : null;

  const breakdown = sumLines(batches.map((batch) => batch.sales_breakdown));
  const salesTotal = breakdown.filter((line) => labelKey(line.label) === "sales total");
  const salesBreakdown = [
    ...breakdown.filter((line) => labelKey(line.label) !== "sales total"),
    ...salesTotal,
  ];

  return {
    departments: departmentRows,
    departmentTotal,
    summary: sumLines(batches.map((batch) => batch.sales_summary), summaryLabels),
    salesBreakdown,
    taxes: taxRows,
    taxTotal,
  };
}
