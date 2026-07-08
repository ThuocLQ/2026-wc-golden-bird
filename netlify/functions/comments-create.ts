import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { appendRow, readTable } from "../shared/googleSheets.js";
import { createId } from "../shared/ids.js";
import { ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import type { CommentRow, PostRow } from "../shared/types.js";
import { commentCreateSchema } from "../shared/validation.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, commentCreateSchema);
    const posts = await readTable<PostRow>("posts");
    if (!posts.some((post) => post.id === input.postId && post.status === "ACTIVE")) {
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
    return ok(row, 201);
  });
