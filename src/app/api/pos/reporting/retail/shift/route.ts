import { withDb } from "@/lib/db";
import { reportingFailure } from "@/lib/reporting/http";
import { authenticateReportingPos } from "@/lib/reporting/pos-auth";
import { parseRetailShift } from "@/lib/reporting/retail-snapshot";
import { syncRetailShift } from "@/lib/reporting/retail-sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { scope, body } = await authenticateReportingPos(request, "RETAIL");
    const snapshot = parseRetailShift(body);
    const result = await withDb((db) => syncRetailShift(db, scope, snapshot));
    return Response.json(result, {
      status: result.status === "accepted" ? 201 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return reportingFailure(error, "Retail reporting shift sync failed");
  }
}
