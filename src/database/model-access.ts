import "server-only";

import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { withPrisma } from "@/database/globalForPrisma";

type DynamicReadDelegate = {
  count(args?: Record<string, unknown>): Promise<number>;
  findMany(args?: Record<string, unknown>): Promise<unknown[]>;
};

export const prismaModelNames = Object.values(Prisma.ModelName);

export function isPrismaModelName(value: string): value is Prisma.ModelName {
  return prismaModelNames.some((modelName) => modelName === value);
}

/**
 * Resolves a generated Prisma delegate without maintaining a model-by-model map.
 * Keep this helper server-side and validate model/field access in the calling
 * report service before exposing results to a client.
 */
export function getPrismaModel(
  prisma: PrismaClient,
  modelName: Prisma.ModelName,
): DynamicReadDelegate {
  const delegateName = `${modelName[0].toLowerCase()}${modelName.slice(1)}`;
  const delegate = (prisma as unknown as Record<string, unknown>)[delegateName];

  if (!delegate || typeof delegate !== "object") {
    throw new Error(`Prisma model delegate not found: ${modelName}`);
  }

  return delegate as DynamicReadDelegate;
}

export async function findModelRows(
  modelName: Prisma.ModelName,
  args: Record<string, unknown> = {},
) {
  return withPrisma((prisma) =>
    getPrismaModel(prisma, modelName).findMany(args),
  );
}
