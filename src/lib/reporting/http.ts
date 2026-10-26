import { ReportingError } from "./snapshot.ts";

export function reportingFailure(error: unknown, logLabel: string): Response {
  if (error instanceof ReportingError)
    return Response.json({ error: error.message }, { status: error.status });
  const code = (error as { code?: string }).code;
  if (code === "23505" || code === "23503" || code === "23514")
    return Response.json(
      { error: "Snapshot conflicts with reporting record ownership or relationships." },
      { status: 409 },
    );
  if (code === "22003" || code === "22007" || code === "22008" || code === "22P02")
    return Response.json({ error: "Invalid reporting value." }, { status: 400 });
  console.error(logLabel, { code: code ?? "unknown" });
  return Response.json(
    { error: "Reporting sync unavailable; retry the same request." },
    { status: 503 },
  );
}
