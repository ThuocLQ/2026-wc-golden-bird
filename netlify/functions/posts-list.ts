import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { getTodayLocalDate } from "../shared/date.js";
import { authorFor, getFeedSupport, myReaction, summarizeReactions } from "../shared/feed.js";
import { readTable } from "../shared/googleSheets.js";
import { handleApi, ok } from "../shared/response.js";
import type { PostRow } from "../shared/types.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const date = event.queryStringParameters?.date || getTodayLocalDate();
    const [posts, support] = await Promise.all([readTable<PostRow>("posts"), getFeedSupport(user.id)]);

    const data = posts
      .filter((post) => post.lunchDate === date && post.status === "ACTIVE")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((post) => ({
        id: post.id,
        lunchDate: post.lunchDate,
        author: authorFor(support.users, post.authorId),
        content: post.content,
        reactionSummary: summarizeReactions(support.reactions, "POST", post.id),
        myReaction: myReaction(support.reactions, user.id, "POST", post.id),
        commentCount: support.comments.filter((comment) => comment.postId === post.id && comment.status === "ACTIVE").length,
        createdAt: post.createdAt,
        canDelete: user.role === "ADMIN" || user.id === post.authorId,
      }));

    return ok(data);
  });
