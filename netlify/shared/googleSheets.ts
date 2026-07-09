import { google } from "googleapis";
import { ApiError } from "./response.js";
import { columnLetter, headersFor, type TableName } from "./sheetTables.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ApiError("SHEET_ERROR", `Missing ${name}`);
  }
  return value;
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

export async function readTable<T extends Record<string, string>>(tableName: TableName): Promise<Array<T & { rowNumber: number }>> {
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

export async function appendRow(tableName: TableName, values: string[]): Promise<void> {
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

export async function updateRow(tableName: TableName, rowNumber: number, values: string[]): Promise<void> {
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
