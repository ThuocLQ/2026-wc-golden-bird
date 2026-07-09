import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { readSheetTable } from "../netlify/shared/googleSheets.js";
import { tableHeaders, type TableName } from "../netlify/shared/sheetTables.js";

loadLocalEnv();

const supabaseUrl = requiredEnv("SUPABASE_URL");
const supabaseServiceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const migrationOrder: TableName[] = ["users", "lunch_entries", "posts", "comments", "reactions", "email_logs", "app_config"];

for (const tableName of migrationOrder) {
  const rows = await readSheetTable<Record<string, string>>(tableName);
  if (rows.length === 0) {
    console.log(`Skipped ${tableName}: no rows`);
    continue;
  }

  const payload = rows.map(({ rowNumber, ...row }) => normalizeRow(tableName, row));
  const onConflict = tableName === "app_config" ? "key" : "id";
  const { error } = await supabase.from(tableName).upsert(payload, { onConflict });
  if (error) {
    throw new Error(`Could not migrate ${tableName}: ${error.message}`);
  }

  console.log(`Migrated ${payload.length} ${tableName} rows`);
}

function normalizeRow(tableName: TableName, row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const header of tableHeaders[tableName]) {
    normalized[header] = row[header] ?? "";
  }
  return normalized;
}

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].replace(/^\uFEFF/, "").trim();
    process.env[key] = process.env[key] || match[2];
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
