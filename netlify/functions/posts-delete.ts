import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { readTable, updateRow } from "../shared/googleSheets.js";
import { ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import type { PostRow } from "../shared/types.js";
import { postIdSchema } from "../shared/validation.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, postIdSchema);
    const posts = await readTable<PostRow>("posts");
    const post = posts.find((item) => item.id === input.postId && item.status === "ACTIVE");
    if (!post) throw new ApiError("NOT_FOUND", "Post not found");
    if (post.authorId !== user.id && user.role !== "ADMIN") throw new ApiError("FORBIDDEN", "Cannot delete this post");

    const updated: PostRow = { ...post, status: "DELETED", updatedAt: nowIso() };
    await updateRow("posts", post.rowNumber, valuesFor("posts", updated));
    return ok({ id: post.id });
  });
