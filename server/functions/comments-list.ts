import { requireAuth } from "../shared/auth.js";
import { authorFor, myReaction, summarizeReactions } from "../shared/feed.js";
import { ApiHandler, ApiError, handleApi, ok } from "../shared/response.js";
import { listActiveUsers, listCommentsByPostIds, listReactionsForTargets } from "../shared/supabaseStore.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const postId = event.queryStringParameters?.postId;
    if (!postId) throw new ApiError("VALIDATION_ERROR", "Missing postId");

    const comments = await listCommentsByPostIds([postId]);

    if (comments.length === 0) {
      return ok([]);
    }

    const [users, reactions] = await Promise.all([
      listActiveUsers(),
      listReactionsForTargets(comments.map((comment) => ({ targetType: "COMMENT", targetId: comment.id }))),
    ]);

    return ok(
      comments
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
