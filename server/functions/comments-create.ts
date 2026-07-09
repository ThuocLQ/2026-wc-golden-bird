import { requireAuth } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { appendRow } from "../shared/googleSheets.js";
import { createId } from "../shared/ids.js";
import { ApiHandler, ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import { findActivePost, touchVersions } from "../shared/supabaseStore.js";
import type { CommentRow, PostRow } from "../shared/types.js";
import { commentCreateSchema } from "../shared/validation.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, commentCreateSchema);
    const post = await findActivePost(input.postId);
    if (!post) {
      throw new ApiError("NOT_FOUND", "Post not found");
    }

    const now = nowIso();
    const row: CommentRow = {
      id: createId("comment"),
      postId: input.postId,
      authorId: user.id,
      content: input.content,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    await appendRow("comments", valuesFor("comments", row));
    await touchVersions(["feed", "comments"]);
    return ok(row, 201);
  });
