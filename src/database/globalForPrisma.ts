import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseConnectionString } from "@/lib/db";

function createPrisma() {
  const connectionString = getDatabaseConnectionString();

  const adapter = new PrismaPg({
    connectionString,
    max: 1,
    maxUses: 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
  });

  return new PrismaClient({ adapter });
}

export async function withPrisma<T>(
  query: (prisma: PrismaClient) => Promise<T>,
) {
  const prisma = createPrisma();
  try {
    return await query(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
