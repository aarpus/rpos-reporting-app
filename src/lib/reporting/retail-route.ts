import { withDb } from "@/lib/db";
import { reportingFailure } from "@/lib/reporting/http";
import { authenticateReportingPos } from "@/lib/reporting/pos-auth";
import type { RetailTableName } from "@/lib/reporting/retail-columns";
import { parseRetailEntity } from "@/lib/reporting/retail-snapshot";
import { syncRetailEntity } from "@/lib/reporting/retail-sync";

export function createRetailEntityPost(table: RetailTableName, envelopeKey: string, logLabel: string) {
  return async function POST(request: Request) {
    try {
      const { scope, body } = await authenticateReportingPos(request, "RETAIL");
      const snapshot = parseRetailEntity(body, envelopeKey, table);
      const result = await withDb((db) => syncRetailEntity(db, scope, table, snapshot));
      return Response.json(result, {
        status: result.status === "accepted" ? 201 : 200,
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      return reportingFailure(error, logLabel);
    }
  };
}
