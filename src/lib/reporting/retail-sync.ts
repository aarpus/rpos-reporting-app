import type { Client } from "pg";
import { quoteRetailIdent } from "./retail-columns.ts";
import {
  type RetailShiftSnapshot,
  type ShiftEndReport,
  type ShiftReportLine,
} from "./retail-snapshot.ts";
import { ReportingError, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";

export type RetailSyncResult = {
  status: "accepted" | "duplicate";
  request_id: string;
  shiftid?: string;
};

async function assertRetailScope(db: Pick<Client, "query">, scope: ReportingScope) {
  const active = await db.query(
    `SELECT 1 FROM public.stores s JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
     WHERE s.store_code = $1 AND r.schema_name = $2
     AND s.active AND s.store_type = 'RETAIL' AND r.reporting_version = 1
     FOR SHARE OF s, r`,
    [scope.storeCode, scope.schemaName],
  );
  if (!active.rowCount) throw new ReportingError("Store reporting scope unavailable.", 403);
}

async function inRetailTransaction<T>(db: Pick<Client, "query">, scope: ReportingScope, kind: string, id: string, work: () => Promise<T>) {
  await db.query("BEGIN");
  try {
    await assertRetailScope(db, scope);
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
      `${scope.schemaName}:retail:${kind}:${scope.storeCode}`,
      id,
    ]);
    const result = await work();
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

const shiftEndCards = ["sale", "taxes", "sale_breakdown", "terminalcashstatus", "miscellaneous", "terminalcashtransfer"] as const;

function shiftEndTable(schemaName: string) {
  return `${schemaIdentifier(schemaName)}.${quoteRetailIdent("tbl_shift_end_report")}`;
}

function sameLines(left: ShiftReportLine[], right: ShiftReportLine[]) {
  return left.length === right.length && left.every((line, index) => line.label === right[index].label && line.value === right[index].value);
}

function sameShiftEnd(left: ShiftEndReport, right: ShiftEndReport) {
  return left.shiftid === right.shiftid
    && left.stationname === right.stationname
    && left.batch_number === right.batch_number
    && left.shift === right.shift
    && left.start_time === right.start_time
    && left.end_time === right.end_time
    && left.status === right.status
    && left.employeename === right.employeename
    && left.employeeid === right.employeeid
    && left.totaltime === right.totaltime
    && shiftEndCards.every((card) => sameLines(left[card], right[card]));
}

function storedTimestamp(value: unknown, name: string) {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(typeof value === "string" || typeof value === "number" ? value : "");
  if (!Number.isFinite(date.getTime())) throw new ReportingError(`Invalid stored ${name}.`, 503);
  return date.toISOString();
}

function storedLines(value: unknown, name: string): ShiftReportLine[] {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      throw new ReportingError(`Invalid stored ${name}.`, 503);
    }
  }
  if (!Array.isArray(parsed)) throw new ReportingError(`Invalid stored ${name}.`, 503);
  return parsed.map((line) => {
    if (!line || typeof line !== "object" || Array.isArray(line)) throw new ReportingError(`Invalid stored ${name}.`, 503);
    const record = line as Record<string, unknown>;
    if (typeof record.label !== "string" || typeof record.value !== "string") throw new ReportingError(`Invalid stored ${name}.`, 503);
    return { label: record.label, value: record.value };
  });
}

export function storedShiftEnd(record: Record<string, unknown>): ShiftEndReport {
  const status = record.status;
  if (status !== "Open" && status !== "Close") throw new ReportingError("Invalid stored status.", 503);
  const shift = Number(record.shift);
  const employeeid = record.employeeid === null || record.employeeid === undefined ? null : Number(record.employeeid);
  if (!Number.isSafeInteger(shift) || (employeeid !== null && !Number.isSafeInteger(employeeid)))
    throw new ReportingError("Invalid stored shift report.", 503);
  const start_time = storedTimestamp(record.start_time, "start_time");
  if (!start_time) throw new ReportingError("Invalid stored start_time.", 503);
  return {
    shiftid: String(record.shiftid),
    stationname: String(record.stationname),
    batch_number: String(record.batch_number),
    shift,
    start_time,
    end_time: storedTimestamp(record.end_time, "end_time"),
    status,
    employeename: record.employeename === null || record.employeename === undefined ? null : String(record.employeename),
    employeeid,
    totaltime: record.totaltime === null || record.totaltime === undefined ? null : String(record.totaltime),
    sale: storedLines(record.sale, "sale"),
    taxes: storedLines(record.taxes, "taxes"),
    sale_breakdown: storedLines(record.sale_breakdown, "sale_breakdown"),
    terminalcashstatus: storedLines(record.terminalcashstatus, "terminalcashstatus"),
    miscellaneous: storedLines(record.miscellaneous, "miscellaneous"),
    terminalcashtransfer: storedLines(record.terminalcashtransfer, "terminalcashtransfer"),
  };
}

function shiftEndValues(shift: ShiftEndReport) {
  return [
    shift.shiftid,
    shift.stationname,
    shift.batch_number,
    shift.shift,
    shift.start_time,
    shift.end_time,
    shift.status,
    shift.employeename,
    shift.employeeid,
    shift.totaltime,
    JSON.stringify(shift.sale),
    JSON.stringify(shift.taxes),
    JSON.stringify(shift.sale_breakdown),
    JSON.stringify(shift.terminalcashstatus),
    JSON.stringify(shift.miscellaneous),
    JSON.stringify(shift.terminalcashtransfer),
  ];
}

export async function syncRetailShift(db: Pick<Client, "query">, scope: ReportingScope, snapshot: RetailShiftSnapshot): Promise<RetailSyncResult> {
  const shiftid = snapshot.shift.shiftid;
  return inRetailTransaction(db, scope, "shift", shiftid, async () => {
    const existingResult = await db.query(
      `SELECT "shiftid"::text, "stationname", "batch_number"::text, "shift", "start_time", "end_time", "status",
        "employeename", "employeeid", "totaltime", "sale", "taxes", "sale_breakdown", "terminalcashstatus",
        "miscellaneous", "terminalcashtransfer"
       FROM ${shiftEndTable(scope.schemaName)} WHERE "shiftid" = $1::bigint FOR UPDATE`,
      [shiftid],
    );
    if ((existingResult.rowCount ?? 0) > 1) throw new ReportingError("shiftid is already duplicated in this store.", 409);
    const existing = existingResult.rowCount ? storedShiftEnd(existingResult.rows[0] as Record<string, unknown>) : null;
    if (existing && sameShiftEnd(existing, snapshot.shift))
      return { status: "duplicate" as const, request_id: snapshot.request_id, shiftid };
    const values = shiftEndValues(snapshot.shift);
    if (existing) {
      const result = await db.query(
        `UPDATE ${shiftEndTable(scope.schemaName)} SET
          "stationname" = $2, "batch_number" = $3::bigint, "shift" = $4::integer,
          "start_time" = $5::timestamptz, "end_time" = $6::timestamptz, "status" = $7,
          "employeename" = $8, "employeeid" = $9::integer, "totaltime" = $10,
          "sale" = $11::jsonb, "taxes" = $12::jsonb, "sale_breakdown" = $13::jsonb,
          "terminalcashstatus" = $14::jsonb, "miscellaneous" = $15::jsonb, "terminalcashtransfer" = $16::jsonb
         WHERE "shiftid" = $1::bigint`,
        values,
      );
      if (result.rowCount !== 1) throw new ReportingError("Retail row update did not match one record.", 409);
    } else {
      await db.query(
        `INSERT INTO ${shiftEndTable(scope.schemaName)} (
          "shiftid", "stationname", "batch_number", "shift", "start_time", "end_time", "status",
          "employeename", "employeeid", "totaltime", "sale", "taxes", "sale_breakdown",
          "terminalcashstatus", "miscellaneous", "terminalcashtransfer"
        ) VALUES (
          $1::bigint, $2, $3::bigint, $4::integer, $5::timestamptz, $6::timestamptz, $7,
          $8, $9::integer, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb
        )`,
        values,
      );
    }
    return { status: "accepted" as const, request_id: snapshot.request_id, shiftid };
  });
}
