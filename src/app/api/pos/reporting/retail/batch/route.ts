import { withDb } from "@/lib/db";
import { reportingFailure } from "@/lib/reporting/http";
import { authenticateReportingPos } from "@/lib/reporting/pos-auth";
import { parseRetailBatch } from "@/lib/reporting/retail-snapshot";
import { syncRetailBatch } from "@/lib/reporting/retail-sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { scope, body } = await authenticateReportingPos(request, "RETAIL");
    const snapshot = parseRetailBatch(body);
    const result = await withDb((db) => syncRetailBatch(db, scope, snapshot));
    return Response.json(result, {
      status: result.status === "accepted" ? 201 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return reportingFailure(error, "Retail reporting batch sync failed");
  }
}
