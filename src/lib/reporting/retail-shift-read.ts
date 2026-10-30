import type { Client } from "pg";
import { storedShiftEnd } from "./retail-sync.ts";
import { ReportingError, businessDate, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";
import type { ShiftEndReport } from "./retail-snapshot.ts";

export type RetailReportScope = ReportingScope & { timezone: string };
export type ShiftEndListRow = {
  id: string;
  shiftid: string;
  stationname: string;
  batch_number: string;
  shift: number;
  start_time: string;
  end_time: string | null;
  status: ShiftEndReport["status"];
};
export type ShiftEndDetail = ShiftEndReport & { id: string };

function reportTable(schemaName: string) {
  return `${schemaIdentifier(schemaName)}."tbl_shift_end_report"`;
}

function iso(value: unknown, name: string) {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(typeof value === "string" || typeof value === "number" ? value : "");
  if (!Number.isFinite(date.getTime())) throw new ReportingError(`Invalid stored ${name}.`, 503);
  return date.toISOString();
}

function listRow(record: Record<string, unknown>): ShiftEndListRow {
  const status = record.status;
  if (status !== "Open" && status !== "Close") throw new ReportingError("Invalid stored status.", 503);
  const shift = Number(record.shift);
  const start_time = iso(record.start_time, "start_time");
  if (!Number.isSafeInteger(shift) || !start_time) throw new ReportingError("Invalid stored shift report.", 503);
  return {
    id: String(record.id),
    shiftid: String(record.shiftid),
    stationname: String(record.stationname),
    batch_number: String(record.batch_number),
    shift,
    start_time,
    end_time: iso(record.end_time, "end_time"),
    status,
  };
}

export async function resolveRetailReportingScope(db: Pick<Client, "query">, user: { id: string; role: string }, storeCode: string): Promise<RetailReportScope> {
  const result = await db.query<{ schema_name: string; timezone: string }>(`
    SELECT r.schema_name, s.timezone
    FROM public.stores s JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
    JOIN public.auth_users u ON u.id = $2
    WHERE s.store_code = $1 AND s.active AND s.store_type = 'RETAIL' AND r.reporting_version = 1 AND u.active
      AND (u.role = 'ADMIN' OR EXISTS (SELECT 1 FROM public.store_access a WHERE a.user_id = u.id AND a.store_code = s.store_code))`, [storeCode, user.id]);
  const row = result.rows[0];
  if (!row) throw new ReportingError("Store reporting is unavailable or not accessible.", 403);
  return { schemaName: row.schema_name, storeCode, timezone: row.timezone };
}

export function parseShiftEndFilters(params: URLSearchParams) {
  const from = businessDate(params.get("from"));
  const to = businessDate(params.get("to"));
  if (from > to) throw new ReportingError("from must not be after to.");
  return { from, to };
}

export function parseShiftEndId(value: string) {
  if (!/^\d+$/.test(value) || value.length > 19 || BigInt(value) <= BigInt(0) || BigInt(value) > BigInt("9223372036854775807"))
    throw new ReportingError("Invalid shift report id.");
  return value;
}

export async function readShiftEndList(db: Pick<Client, "query">, scope: RetailReportScope, filters: { from: string; to: string }) {
  const result = await db.query(
    `SELECT "id"::text AS id, "shiftid"::text AS shiftid, "stationname", "batch_number"::text AS batch_number,
      "shift", "start_time", "end_time", "status"
     FROM ${reportTable(scope.schemaName)}
     WHERE ("start_time" AT TIME ZONE $1)::date <= $3::date
       AND ("end_time" IS NULL OR ("end_time" AT TIME ZONE $1)::date >= $2::date)
     ORDER BY "start_time" DESC, "id" DESC`,
    [scope.timezone, filters.from, filters.to],
  );
  return result.rows.map((row) => listRow(row as Record<string, unknown>));
}

export async function readShiftEndDetail(db: Pick<Client, "query">, scope: RetailReportScope, id: string): Promise<ShiftEndDetail | null> {
  const result = await db.query(
    `SELECT "id"::text AS id, "shiftid"::text AS shiftid, "stationname", "batch_number"::text AS batch_number,
      "shift", "start_time", "end_time", "status", "employeename", "employeeid", "totaltime",
      "sale", "taxes", "sale_breakdown", "terminalcashstatus", "miscellaneous", "terminalcashtransfer"
     FROM ${reportTable(scope.schemaName)} WHERE "id" = $1::bigint`,
    [id],
  );
  if (!result.rowCount) return null;
  const record = result.rows[0] as Record<string, unknown>;
  return { id: String(record.id), ...storedShiftEnd(record) };
}
