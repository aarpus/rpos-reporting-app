import { withDb } from "@/lib/db";
import { authenticateReportingPos } from "@/lib/reporting/pos-auth";
import { parseSnapshot, ReportingError } from "@/lib/reporting/snapshot";
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
    if (error instanceof ReportingError)
      return Response.json({ error: error.message }, { status: error.status });
    const code = (error as { code?: string }).code;
    if (code === "23505" || code === "23503" || code === "23514")
      return Response.json(
        {
          error:
            "Snapshot conflicts with reporting record ownership or relationships.",
        },
        { status: 409 },
      );
    if (
      code === "22003" ||
      code === "22007" ||
      code === "22008" ||
      code === "22P02"
    )
      return Response.json(
        { error: "Invalid reporting value." },
        { status: 400 },
      );
    console.error("Reporting snapshot failed", { code: code ?? "unknown" });
    return Response.json(
      { error: "Reporting sync unavailable; retry the same request." },
      { status: 503 },
    );
  }
}
