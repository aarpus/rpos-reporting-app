import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Client } from "pg";

export function getDatabaseConnectionString() {
  try {
    const connectionString = getCloudflareContext().env.HYPERDRIVE?.connectionString;
    if (connectionString) return connectionString;
  } catch {
    // Next.js dev, database scripts, and builds run outside a Workers request.
  }

  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  throw new Error("Neither HYPERDRIVE nor DATABASE_URL is configured.");
}

export async function withDb<T>(query: (client: Client) => Promise<T>) {
  const client = new Client({
    connectionString: getDatabaseConnectionString(),
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
  });

  await client.connect();
  try {
    return await query(client);
  } finally {
    await client.end();
  }
}
