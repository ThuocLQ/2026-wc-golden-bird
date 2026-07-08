import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hashPin } from "../netlify/shared/auth.js";
import { nowIso } from "../netlify/shared/date.js";
import { appendRow, readTable, updateRow } from "../netlify/shared/googleSheets.js";
import { valuesFor } from "../netlify/shared/sheetTables.js";
import type { UserRow } from "../netlify/shared/types.js";

loadLocalEnv();

const email = (process.argv[2] ?? "admin@example.com").toLowerCase();
const pin = process.argv[3] ?? "123456";
const displayName = process.argv[4] ?? "Admin";

const users = await readTable<UserRow>("users");
const existing = users.find((user) => user.email.toLowerCase() === email || user.id === "u_admin");
const now = nowIso();
const row: UserRow = {
  id: existing?.id ?? "u_admin",
  email,
  displayName,
  pinHash: await hashPin(pin),
  role: "ADMIN",
  status: "ACTIVE",
  createdAt: existing?.createdAt ?? now,
  updatedAt: now,
};

if (existing) {
  await updateRow("users", existing.rowNumber, valuesFor("users", row));
  console.log(`Updated admin ${email}`);
} else {
  await appendRow("users", valuesFor("users", row));
  console.log(`Created admin ${email}`);
}

function loadLocalEnv() {
  if (!process.env.GOOGLE_SHEET_ID) {
    const envPath = resolve(process.cwd(), ".env");
    if (!existsSync(envPath)) return;

    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].replace(/^\uFEFF/, "").trim();
      const value = match[2];
      process.env[key] = process.env[key] || value;
    }
  }
}
