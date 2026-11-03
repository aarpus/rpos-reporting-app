import { withDb } from "@/lib/db";
import { getRequestUser, normalizeStoreCode } from "@/lib/store-access";
import {
  parseJournalFilters,
  parseJournalId,
  readJournalDetail,
  readJournalList,
  resolveRetailJournalScope,
} from "@/lib/reporting/retail-transaction-journal";
import { ReportingError } from "@/lib/reporting/snapshot";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const user = await getRequestUser();
    if (!user)
      return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    const params = new URL(request.url).searchParams;
    const storeCode = normalizeStoreCode(params.get("store_code"));
    if (!storeCode) throw new ReportingError("store_code is required.");
    const id = params.get("id");
    const report = await withDb(async (db) => {
      await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      try {
        const scope = await resolveRetailJournalScope(db, user, storeCode);
        if (id !== null) {
          const transaction = await readJournalDetail(db, scope, parseJournalId(id));
          if (!transaction) throw new ReportingError("Transaction not found.", 404);
          await db.query("COMMIT");
          return { storeCode: scope.storeCode, timezone: scope.timezone, transaction };
        }
        const rows = await readJournalList(db, scope, parseJournalFilters(params));
        await db.query("COMMIT");
        return { storeCode: scope.storeCode, timezone: scope.timezone, rows };
      } catch (error) {
        await db.query("ROLLBACK");
        throw error;
      }
    });
    return Response.json(report, { headers });
  } catch (error) {
    if (error instanceof ReportingError)
      return Response.json({ error: error.message }, { status: error.status, headers });
    console.error("Reporting query failed", { code: (error as { code?: string }).code ?? "unknown" });
    return Response.json({ error: "Reporting is temporarily unavailable." }, { status: 503, headers });
  }
}
