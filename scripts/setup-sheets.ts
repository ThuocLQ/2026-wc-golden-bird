import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { google } from "googleapis";
import { columnLetter, tableHeaders, type TableName } from "../server/shared/sheetTables.js";

loadLocalEnv();

const spreadsheetId = requiredEnv("GOOGLE_SHEET_ID");
const sheets = google.sheets({
  version: "v4",
  auth: new google.auth.JWT({
    email: requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: requiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  }),
});

const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
const existingSheets = new Set((spreadsheet.data.sheets ?? []).map((sheet) => sheet.properties?.title).filter(Boolean));
const missingTables = (Object.keys(tableHeaders) as TableName[]).filter((tableName) => !existingSheets.has(tableName));

if (missingTables.length > 0) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: missingTables.map((tableName) => ({
        addSheet: {
          properties: {
            title: tableName,
          },
        },
      })),
    },
  });
}

for (const tableName of Object.keys(tableHeaders) as TableName[]) {
  const headers = [...tableHeaders[tableName]];
  const lastColumn = columnLetter(headers.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tableName}!A1:${lastColumn}1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [headers],
    },
  });
}

console.log(`Ensured ${Object.keys(tableHeaders).length} sheet tabs and headers.`);
if (missingTables.length > 0) {
  console.log(`Created tabs: ${missingTables.join(", ")}`);
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
