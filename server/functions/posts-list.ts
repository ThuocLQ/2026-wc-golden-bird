import { requireAuth } from "../shared/auth.js";
import { getTodayLocalDate } from "../shared/date.js";
import { authorFor, myReaction, summarizeReactions } from "../shared/feed.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";
import { listActiveUsers, listCommentsByPostIds, listPostsByDate, listReactionsForTargets } from "../shared/supabaseStore.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const date = event.queryStringParameters?.date || getTodayLocalDate();
    const [posts, users] = await Promise.all([listPostsByDate(date), listActiveUsers()]);
    const comments = await listCommentsByPostIds(posts.map((post) => post.id));
    const reactions = await listReactionsForTargets([
      ...posts.map((post) => ({ targetType: "POST", targetId: post.id })),
      ...comments.map((comment) => ({ targetType: "COMMENT", targetId: comment.id })),
    ]);

    const data = posts
      .map((post) => {
        const postComments = comments
          .filter((comment) => comment.postId === post.id && comment.status === "ACTIVE")
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
          }));

        return {
          id: post.id,
          lunchDate: post.lunchDate,
          author: authorFor(users, post.authorId),
          content: post.content,
          reactionSummary: summarizeReactions(reactions, "POST", post.id),
          myReaction: myReaction(reactions, user.id, "POST", post.id),
          commentCount: postComments.length,
          comments: postComments,
          createdAt: post.createdAt,
          canDelete: user.role === "ADMIN" || user.id === post.authorId,
        };
      });

    return ok(data);
  });
