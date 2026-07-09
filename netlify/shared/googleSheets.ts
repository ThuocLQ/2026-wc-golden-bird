import { google } from "googleapis";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./response.js";
import { columnLetter, headersFor, type TableName } from "./sheetTables.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ApiError("SHEET_ERROR", `Missing ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name];
}

function getPrivateKey(): string {
  return requiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: getPrivateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

let supabaseClient: SupabaseClient | null = null;

function hasSupabaseConfig(): boolean {
  return Boolean(optionalEnv("SUPABASE_URL") && getSupabaseServerKey());
}

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  const serverKey = getSupabaseServerKey();
  if (!serverKey) {
    throw new ApiError("SHEET_ERROR", "Missing SUPABASE_SECRET_KEY");
  }
  supabaseClient = createClient(requiredEnv("SUPABASE_URL"), serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return supabaseClient;
}

function getSupabaseServerKey(): string | undefined {
  return optionalEnv("SUPABASE_SECRET_KEY") || optionalEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function rowFromValues(tableName: TableName, values: string[]): Record<string, string> {
  return headersFor(tableName).reduce<Record<string, string>>((acc, header, index) => {
    acc[header] = values[index] ?? "";
    return acc;
  }, {});
}

function primaryKeyFor(tableName: TableName): string {
  return tableName === "app_config" ? "key" : "id";
}

function insertConflictKeyFor(tableName: TableName): string | undefined {
  if (tableName === "lunch_entries") return "lunchDate,userId";
  if (tableName === "reactions") return "userId,targetType,targetId";
  if (tableName === "app_config") return "key";
  return undefined;
}

function isRetryableSheetError(error: unknown): boolean {
  const candidate = error as { code?: number; response?: { status?: number } };
  const status = candidate.response?.status ?? candidate.code;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function withSheetRetry<T>(action: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (!isRetryableSheetError(error) || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function readSheetTable<T extends Record<string, string>>(tableName: TableName): Promise<Array<T & { rowNumber: number }>> {
  try {
    const sheets = getSheetsClient();
    const response = await withSheetRetry(() =>
      sheets.spreadsheets.values.get({
        spreadsheetId: requiredEnv("GOOGLE_SHEET_ID"),
        range: `${tableName}!A:Z`,
      }),
    );

    const rows = response.data.values ?? [];
    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0].map(String);
    return rows.slice(1).map((row, index) => {
      const object = headers.reduce<Record<string, string>>((acc, header, headerIndex) => {
        acc[header] = String(row[headerIndex] ?? "");
        return acc;
      }, {});
      return { ...(object as T), rowNumber: index + 2 };
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(error);
    throw new ApiError("SHEET_ERROR", `Could not read ${tableName}`);
  }
}

export async function appendSheetRow(tableName: TableName, values: string[]): Promise<void> {
  try {
    const sheets = getSheetsClient();
    await withSheetRetry(() =>
      sheets.spreadsheets.values.append({
        spreadsheetId: requiredEnv("GOOGLE_SHEET_ID"),
        range: `${tableName}!A:A`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [values] },
      }),
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(error);
    throw new ApiError("SHEET_ERROR", `Could not append ${tableName}`);
  }
}

export async function updateSheetRow(tableName: TableName, rowNumber: number, values: string[]): Promise<void> {
  try {
    const lastColumn = columnLetter(headersFor(tableName).length);
    const sheets = getSheetsClient();
    await withSheetRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: requiredEnv("GOOGLE_SHEET_ID"),
        range: `${tableName}!A${rowNumber}:${lastColumn}${rowNumber}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [values] },
      }),
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(error);
    throw new ApiError("SHEET_ERROR", `Could not update ${tableName}`);
  }
}

async function readSupabaseTable<T extends Record<string, string>>(tableName: TableName): Promise<Array<T & { rowNumber: number }>> {
  const { data, error } = await withSupabaseRetry(() => getSupabaseClient().from(tableName).select("*"));
  if (error) {
    console.error(error);
    throw new ApiError("SHEET_ERROR", `Could not read ${tableName}`);
  }

  return (data ?? []).map((row, index) => ({ ...(row as T), rowNumber: index + 2 }));
}

async function appendSupabaseRow(tableName: TableName, values: string[]): Promise<void> {
  const row = rowFromValues(tableName, values);
  const conflictKey = insertConflictKeyFor(tableName);
  const { error } = await withSupabaseRetry(() => {
    const query = getSupabaseClient().from(tableName);
    return conflictKey ? query.upsert(row, { onConflict: conflictKey }) : query.insert(row);
  });
  if (error) {
    console.error(error);
    throw new ApiError("SHEET_ERROR", `Could not append ${tableName}`);
  }
}

async function updateSupabaseRow(tableName: TableName, values: string[]): Promise<void> {
  const row = rowFromValues(tableName, values);
  const primaryKey = primaryKeyFor(tableName);
  const primaryValue = row[primaryKey];
  if (!primaryValue) {
    throw new ApiError("SHEET_ERROR", `Could not update ${tableName}`);
  }

  const { error } = await withSupabaseRetry(() => getSupabaseClient().from(tableName).update(row).eq(primaryKey, primaryValue));
  if (error) {
    console.error(error);
    throw new ApiError("SHEET_ERROR", `Could not update ${tableName}`);
  }
}

async function withSupabaseRetry<T extends { error: unknown }>(action: () => PromiseLike<T>): Promise<T> {
  let result = await action();
  for (let attempt = 0; result.error && attempt < 2; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    result = await action();
  }
  return result;
}

export async function readTable<T extends Record<string, string>>(tableName: TableName): Promise<Array<T & { rowNumber: number }>> {
  return hasSupabaseConfig() ? readSupabaseTable<T>(tableName) : readSheetTable<T>(tableName);
}

export async function appendRow(tableName: TableName, values: string[]): Promise<void> {
  return hasSupabaseConfig() ? appendSupabaseRow(tableName, values) : appendSheetRow(tableName, values);
}

export async function updateRow(tableName: TableName, rowNumber: number, values: string[]): Promise<void> {
  return hasSupabaseConfig() ? updateSupabaseRow(tableName, values) : updateSheetRow(tableName, rowNumber, values);
}
