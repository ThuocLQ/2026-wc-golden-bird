import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { authorFor, myReaction, summarizeReactions } from "../shared/feed.js";
import { readTable } from "../shared/googleSheets.js";
import { ApiError, handleApi, ok } from "../shared/response.js";
import type { CommentRow, ReactionRow, UserRow } from "../shared/types.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const postId = event.queryStringParameters?.postId;
    if (!postId) throw new ApiError("VALIDATION_ERROR", "Missing postId");

    const [comments, users, reactions] = await Promise.all([
      readTable<CommentRow>("comments"),
      readTable<UserRow>("users"),
      readTable<ReactionRow>("reactions"),
    ]);

    return ok(
      comments
        .filter((comment) => comment.postId === postId && comment.status === "ACTIVE")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((comment) => ({
          id: comment.id,
          postId: comment.postId,
          author: authorFor(users, comment.authorId),
          content: comment.content,
          reactionSummary: summarizeReactions(reactions, "COMMENT", comment.id),
          myReaction: myReaction(reactions, user.id, "COMMENT", comment.id),
          createdAt: comment.createdAt,
          canDelete: user.role === "ADMIN" || user.id === comment.authorId,
        })),
    );
  });
