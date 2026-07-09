import { requireAuth } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { ApiHandler, ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { findActivePost, touchVersions, updateById } from "../shared/supabaseStore.js";
import type { PostRow } from "../shared/types.js";
import { postIdSchema } from "../shared/validation.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, postIdSchema);
    const post = await findActivePost(input.postId);
    if (!post) throw new ApiError("NOT_FOUND", "Post not found");
    if (post.authorId !== user.id && user.role !== "ADMIN") throw new ApiError("FORBIDDEN", "Cannot delete this post");

    const updated: PostRow = { ...post, status: "DELETED", updatedAt: nowIso() };
    await updateById("posts", updated);
    await touchVersions(["feed", "comments"]);
    return ok({ id: post.id });
  });
