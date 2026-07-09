import { requireAuth } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { ApiHandler, ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { findActiveComment, touchVersions, updateById } from "../shared/supabaseStore.js";
import type { CommentRow } from "../shared/types.js";
import { commentIdSchema } from "../shared/validation.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, commentIdSchema);
    const comment = await findActiveComment(input.commentId);
    if (!comment) throw new ApiError("NOT_FOUND", "Comment not found");
    if (comment.authorId !== user.id && user.role !== "ADMIN") throw new ApiError("FORBIDDEN", "Cannot delete this comment");

    const updated: CommentRow = { ...comment, status: "DELETED", updatedAt: nowIso() };
    await updateById("comments", updated);
    await touchVersions(["feed", "comments"]);
    return ok({ id: comment.id });
  });
