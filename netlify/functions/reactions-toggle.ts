import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { appendRow, readTable, updateRow } from "../shared/googleSheets.js";
import { createId } from "../shared/ids.js";
import { handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import type { ReactionRow } from "../shared/types.js";
import { reactionToggleSchema } from "../shared/validation.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, reactionToggleSchema);
    const reactions = await readTable<ReactionRow>("reactions");
    const existing = reactions.find(
      (item) => item.userId === user.id && item.targetType === input.targetType && item.targetId === input.targetId,
    );
    const now = nowIso();

    if (!existing) {
      const row: ReactionRow = {
        id: createId("reaction"),
        userId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        reactionType: input.reactionType,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      };
      await appendRow("reactions", valuesFor("reactions", row));
      return ok({ reactionType: input.reactionType });
    }

    const toggleOff = existing.status === "ACTIVE" && existing.reactionType === input.reactionType;
    const updated: ReactionRow = {
      ...existing,
      reactionType: toggleOff ? existing.reactionType : input.reactionType,
      status: toggleOff ? "DELETED" : "ACTIVE",
      updatedAt: now,
    };
    await updateRow("reactions", existing.rowNumber, valuesFor("reactions", updated));
    return ok({ reactionType: toggleOff ? null : input.reactionType });
  });
