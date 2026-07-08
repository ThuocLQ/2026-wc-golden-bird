import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { readTable, updateRow } from "../shared/googleSheets.js";
import { ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import type { CommentRow } from "../shared/types.js";
import { commentIdSchema } from "../shared/validation.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, commentIdSchema);
    const comments = await readTable<CommentRow>("comments");
    const comment = comments.find((item) => item.id === input.commentId && item.status === "ACTIVE");
    if (!comment) throw new ApiError("NOT_FOUND", "Comment not found");
    if (comment.authorId !== user.id && user.role !== "ADMIN") throw new ApiError("FORBIDDEN", "Cannot delete this comment");

    const updated: CommentRow = { ...comment, status: "DELETED", updatedAt: nowIso() };
    await updateRow("comments", comment.rowNumber, valuesFor("comments", updated));
    return ok({ id: comment.id });
  });
