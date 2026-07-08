import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { getTodayLocalDate, nowIso } from "../shared/date.js";
import { appendRow, readTable, updateRow } from "../shared/googleSheets.js";
import { createId } from "../shared/ids.js";
import { handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import type { LunchEntryRow } from "../shared/types.js";
import { lunchEntrySchema } from "../shared/validation.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, lunchEntrySchema);
    const lunchDate = getTodayLocalDate();
    const now = nowIso();
    const entries = await readTable<LunchEntryRow>("lunch_entries");
    const existing = entries.find((entry) => entry.lunchDate === lunchDate && entry.userId === user.id);

    const row: LunchEntryRow = {
      id: existing?.id ?? createId("lunch"),
      lunchDate,
      userId: user.id,
      status: input.status,
      restaurantName: input.status === "EAT_OUT" ? input.restaurantName.trim() : "",
      foodName: input.status === "EAT_OUT" ? input.foodName.trim() : "",
      note: input.note.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      await updateRow("lunch_entries", existing.rowNumber, valuesFor("lunch_entries", row));
    } else {
      await appendRow("lunch_entries", valuesFor("lunch_entries", row));
    }

    return ok(row);
  });
