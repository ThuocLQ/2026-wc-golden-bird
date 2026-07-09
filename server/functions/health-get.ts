import { requireAdmin } from "../shared/auth.js";
import { getSupabaseClient, hasSupabaseConfig } from "../shared/googleSheets.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";
import { getResourceVersions } from "../shared/supabaseStore.js";
import type { TableName } from "../shared/sheetTables.js";

const countTables: TableName[] = ["users", "lunch_entries", "posts", "comments", "reactions", "email_logs", "app_config"];

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    await requireAdmin(event);
    const mode = hasSupabaseConfig() ? "supabase" : "google_sheets";
    const versions = hasSupabaseConfig() ? await getResourceVersions() : null;
    const rowCounts = hasSupabaseConfig() ? await getSupabaseRowCounts() : null;

    return ok({
      mode,
      versions,
      rowCounts,
      checkedAt: new Date().toISOString(),
    });
  });

async function getSupabaseRowCounts(): Promise<Record<TableName, number>> {
  const entries = await Promise.all(
    countTables.map(async (tableName) => {
      const { count, error } = await getSupabaseClient().from(tableName).select("*", { count: "exact", head: true });
      if (error) {
        console.error(error);
        return [tableName, -1] as const;
      }
      return [tableName, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<TableName, number>;
}
