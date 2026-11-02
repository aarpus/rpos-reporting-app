import test from "node:test";
import assert from "node:assert/strict";
import { sumDayEndPeriod } from "../src/app/(dashboard)/report/day-end-report/_components/sum-day-end-period.ts";

function department(name, values) {
  return {
    trans: values.trans,
    name,
    quantity: values.quantity,
    discountAmount: values.discountAmount,
    discountPercent: values.discountPercent,
    subTotal: values.subTotal,
    tax: values.tax,
    total: values.total,
    share: values.share,
  };
}

test("week and month totals add matching day-end batches", () => {
  const beer = department("Beer", {
    trans: "12", quantity: "18", discountAmount: "4.00", discountPercent: "0.76",
    subTotal: "520.00", tax: "46.80", total: "566.80", share: "61.20",
  });
  const wine = department("Wine", {
    trans: "4", quantity: "6", discountAmount: "0.00", discountPercent: "0.00",
    subTotal: "140.00", tax: "12.60", total: "152.60", share: "38.80",
  });
  const summary = sumDayEndPeriod([
    {
      department_sales: {
        rows: [beer, { ...beer, name: "Total", trans: "", quantity: "18", discountAmount: "4.00", discountPercent: "0.76", subTotal: "520.00", tax: "46.80", total: "566.80", share: "100.00" }],
      },
      sales_summary: [
        { label: "Net Sales Amount :", value: "520.00" },
        { label: "Tax Paid", value: "46.80" },
        { label: "Gross Sales Amount", value: "566.80" },
        { label: "No of Transaction", value: "12" },
      ],
      sales_breakdown: [
        { label: "Cash", value: "351.85" },
        { label: "Sales Total", value: "566.80" },
      ],
      tax_detail: { rows: [{ name: "State", quantity: "18", rate: "9.00", taxable: "520.00", tax: "46.80", share: "100.00" }] },
    },
    {
      department_sales: { rows: [{ ...beer, trans: "3", quantity: "2", discountAmount: "1.00", subTotal: "80.00", tax: "7.20", total: "87.20" }, wine] },
      sales_summary: [
        { label: "Net Sales Amount", value: "220.00" },
        { label: "Tax Paid", value: "19.80" },
        { label: "Gross Sales Amount", value: "239.80" },
        { label: "No of Transaction", value: "7" },
      ],
      sales_breakdown: [
        { label: "Cash", value: "100.00" },
        { label: "Credit Card", value: "139.80" },
        { label: "Sales Total", value: "239.80" },
      ],
      tax_detail: { rows: [{ name: "State", quantity: "8", rate: "9.00", taxable: "220.00", tax: "19.80", share: "100.00" }] },
    },
  ]);

  assert.equal(summary.departments.length, 2);
  assert.equal(summary.departments[0].name, "Beer");
  assert.equal(summary.departments[0].quantity, "20");
  assert.equal(summary.departments[0].subTotal, "600.00");
  assert.equal(summary.departments[0].discountAmount, "5.00");
  assert.equal(summary.departments[0].discountPercent, "0.83");
  assert.equal(summary.departments[0].total, "654.00");
  assert.equal(summary.departmentTotal?.name, "Total");
  assert.equal(summary.departmentTotal?.total, "806.60");
  assert.equal(summary.departmentTotal?.share, "100.00");
  assert.deepEqual(summary.summary.map((line) => line.value), ["740.00", "66.60", "806.60", "19"]);
  assert.deepEqual(summary.salesBreakdown.map((line) => line.label), ["Cash", "Credit Card", "Sales Total"]);
  assert.equal(summary.salesBreakdown[0].value, "451.85");
  assert.equal(summary.salesBreakdown[2].value, "806.60");
  assert.equal(summary.taxes[0].rate, "9.00");
  assert.equal(summary.taxes[0].tax, "66.60");
  assert.equal(summary.taxTotal?.share, "100.00");
});
