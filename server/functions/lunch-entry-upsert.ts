import { requireAuth } from "../shared/auth.js";
import { getTodayLocalDate, nowIso } from "../shared/date.js";
import { createId } from "../shared/ids.js";
import { ApiHandler, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { findTodayLunchEntry, touchVersions, upsertLunchEntry } from "../shared/supabaseStore.js";
import type { LunchEntryRow } from "../shared/types.js";
import { lunchEntrySchema } from "../shared/validation.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, lunchEntrySchema);
    const lunchDate = getTodayLocalDate();
    const now = nowIso();
    const existing = await findTodayLunchEntry(lunchDate, user.id);

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

    await upsertLunchEntry(row);
    await touchVersions(["today"]);

    return ok(row);
  });
