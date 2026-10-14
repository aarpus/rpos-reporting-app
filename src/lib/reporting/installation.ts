// Prisma db push creates model tables, but never installs this SQL function.
// Reuse the tracked migration with only the two idempotency changes below.
export function reportingInstallationSql(migration: string): string {
  if (!migration.includes("CREATE TABLE public.store_reporting_schemas (") || !migration.includes("CREATE FUNCTION public.provision_store_reporting(p_store_code text)")) {
    throw new Error("Unexpected store reporting migration; refusing to install.");
  }
  return migration
    .replace("CREATE TABLE public.store_reporting_schemas (", "CREATE TABLE IF NOT EXISTS public.store_reporting_schemas (")
    .replace("CREATE FUNCTION public.provision_store_reporting(p_store_code text)", "CREATE OR REPLACE FUNCTION public.provision_store_reporting(p_store_code text)");
}
