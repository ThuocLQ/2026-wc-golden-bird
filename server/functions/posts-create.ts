import { requireAuth } from "../shared/auth.js";
import { getTodayLocalDate, nowIso } from "../shared/date.js";
import { appendRow } from "../shared/googleSheets.js";
import { createId } from "../shared/ids.js";
import { ApiHandler, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import { touchVersions } from "../shared/supabaseStore.js";
import type { PostRow } from "../shared/types.js";
import { contentSchema } from "../shared/validation.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, contentSchema);
    const now = nowIso();
    const row: PostRow = {
      id: createId("post"),
      lunchDate: getTodayLocalDate(),
      authorId: user.id,
      content: input.content,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    await appendRow("posts", valuesFor("posts", row));
    await touchVersions(["feed"]);
    return ok(row, 201);
  });
