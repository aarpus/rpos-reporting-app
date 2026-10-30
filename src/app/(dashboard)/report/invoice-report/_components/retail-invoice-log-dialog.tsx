"use client";

import {
  Dialog,
  DialogBody,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import { cn } from "@/utils/cn";
import { getRetailInvoiceLogEntries, type RetailInvoiceRow } from "./retail-invoice-data";

export default function RetailInvoiceLogDialog({
  invoice,
  onOpenChange,
}: {
  invoice: RetailInvoiceRow | null;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const entries =
    invoice != null
      ? getRetailInvoiceLogEntries(invoice.id, invoice.type)
      : null;

  return (
    <>
      {invoice && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px]"
          aria-hidden
        />
      )}
      <Dialog
        isOpen={Boolean(invoice)}
        onOpenChange={onOpenChange}
        className="z-[60] flex max-h-[calc(100vh-2rem)] w-[min(72rem,calc(100%-2rem))] max-w-none flex-col overflow-hidden p-0"
      >
        {invoice && (
          <>
            <DialogHeader className="bg-badge-sky-background px-5 py-3.5 pr-14">
              <DialogTitle className="text-base font-semibold text-text-primary">
                Invoice log
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="min-h-0 flex-1 overflow-auto px-5 py-5">
              <div className="overflow-hidden rounded-md border border-card-border">
                <table className="w-full text-sm">
                  <thead className="bg-background-gray-secondary_alt_2">
                    <tr>
                      <th className="w-44 px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-text-secondary">
                        Date
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-text-secondary">
                        Log
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(entries ?? []).map((entry) => (
                      <tr
                        key={`${entry.date}-${entry.log.slice(0, 24)}`}
                        className="border-t border-card-border"
                      >
                        <td
                          className={cn(
                            "px-3 py-2.5 align-top text-sm whitespace-nowrap tabular-nums text-text-primary",
                          )}
                        >
                          {entry.date}
                        </td>
                        <td className="px-3 py-2.5 align-top text-sm break-words text-text-secondary">
                          {entry.log}
                        </td>
                      </tr>
                    ))}
                    {(!entries || entries.length === 0) && (
                      <tr className="border-t border-card-border">
                        <td
                          colSpan={2}
                          className="px-3 py-8 text-center text-sm text-text-tertiary"
                        >
                          No invoice log entries found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DialogBody>
          </>
        )}
      </Dialog>
    </>
  );
}
