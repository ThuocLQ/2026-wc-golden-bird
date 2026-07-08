import { reminderBody, reminderSubject, sendEmail } from "./email.js";
import { getTodayLocalDate, nowIso } from "./date.js";
import { appendRow, readTable } from "./googleSheets.js";
import { createId } from "./ids.js";
import { valuesFor } from "./sheetTables.js";
import type { AppConfigRow, EmailLogRow, LunchEntryRow, UserRow } from "./types.js";

export async function sendReminderEmails() {
  const today = getTodayLocalDate();
  const [users, entries] = await Promise.all([
    readTable<UserRow>("users"),
    readTable<LunchEntryRow>("lunch_entries"),
  ]);

  const updatedUserIds = new Set(entries.filter((entry) => entry.lunchDate === today).map((entry) => entry.userId));
  const recipients = users.filter((user) => user.status === "ACTIVE" && !updatedUserIds.has(user.id));
  const results = [];

  for (const user of recipients) {
    const createdAt = nowIso();
    try {
      await sendEmail(user.email, reminderSubject, reminderBody);
      await appendEmailLog({
        id: createId("email"),
        type: "REMINDER",
        recipientEmail: user.email,
        subject: reminderSubject,
        body: reminderBody,
        status: "SENT",
        errorMessage: "",
        createdAt,
      });
      results.push({ email: user.email, status: "SENT" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";
      await appendEmailLog({
        id: createId("email"),
        type: "REMINDER",
        recipientEmail: user.email,
        subject: reminderSubject,
        body: reminderBody,
        status: "FAILED",
        errorMessage: message,
        createdAt,
      });
      results.push({ email: user.email, status: "FAILED", errorMessage: message });
    }
  }

  return { date: today, sentCount: results.filter((item) => item.status === "SENT").length, failedCount: results.filter((item) => item.status === "FAILED").length, results };
}

export async function reminderEnabled(): Promise<boolean> {
  const config = await readTable<AppConfigRow>("app_config");
  const row = config.find((item) => item.key === "reminderEnabled");
  return (row?.value ?? "true").toLowerCase() === "true";
}

async function appendEmailLog(row: EmailLogRow): Promise<void> {
  await appendRow("email_logs", valuesFor("email_logs", row));
}
