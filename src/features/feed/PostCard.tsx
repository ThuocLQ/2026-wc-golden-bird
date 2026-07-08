import { displayTime } from "../../lib/date";
import { deletePost } from "./feedApi";
import { CommentList } from "./CommentList";
import { ReactionBar } from "./ReactionBar";
import type { Post } from "./types";

export function PostCard({ post, onChanged }: { post: Post; onChanged: () => void }) {
  async function remove() {
    await deletePost(post.id);
    onChanged();
  }

  return (
    <article className="post">
      <div className="row between">
        <div>
          <strong>{post.author.displayName}</strong>
          <span className="muted"> · {displayTime(post.createdAt)}</span>
        </div>
        {post.canDelete && (
          <button className="link" onClick={remove}>
            Xóa
          </button>
        )}
      </div>
      <p>{post.content}</p>
      <ReactionBar targetType="POST" targetId={post.id} summary={post.reactionSummary} myReaction={post.myReaction} onChanged={onChanged} />
      <CommentList postId={post.id} refreshPost={onChanged} />
    </article>
  );
}
