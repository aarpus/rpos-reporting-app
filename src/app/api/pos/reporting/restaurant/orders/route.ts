import { withDb } from "@/lib/db";
import { reportingFailure } from "@/lib/reporting/http";
import { authenticateReportingPos } from "@/lib/reporting/pos-auth";
import { parseSnapshot } from "@/lib/reporting/snapshot";
import { syncOrderSnapshot } from "@/lib/reporting/sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { scope, body } = await authenticateReportingPos(request);
    const snapshot = parseSnapshot(body, scope.storeCode);
    const result = await withDb((db) => syncOrderSnapshot(db, scope, snapshot));
    return Response.json(result, {
      status: result.status === "accepted" ? 201 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return reportingFailure(error, "Reporting snapshot failed");
  }
}
