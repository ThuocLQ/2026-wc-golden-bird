import { requireAuth } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { createId } from "../shared/ids.js";
import { ApiHandler, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { findReaction, saveReaction, touchVersions } from "../shared/supabaseStore.js";
import type { ReactionRow } from "../shared/types.js";
import { reactionToggleSchema } from "../shared/validation.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, reactionToggleSchema);
    const existing = await findReaction(user.id, input.targetType, input.targetId);
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
      await saveReaction(row);
      await touchVersions(["feed", "comments"]);
      return ok({ reactionType: input.reactionType });
    }

    const toggleOff = existing.status === "ACTIVE" && existing.reactionType === input.reactionType;
    const updated: ReactionRow = {
      ...existing,
      reactionType: toggleOff ? existing.reactionType : input.reactionType,
      status: toggleOff ? "DELETED" : "ACTIVE",
      updatedAt: now,
    };
    await saveReaction(updated);
    await touchVersions(["feed", "comments"]);
    return ok({ reactionType: toggleOff ? null : input.reactionType });
  });
