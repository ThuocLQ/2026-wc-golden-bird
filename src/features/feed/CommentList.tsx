import { useEffect, useState } from "react";
import { ErrorMessage } from "../../components/ErrorMessage";
import { displayTime } from "../../lib/date";
import { createComment, deleteComment, listComments } from "./feedApi";
import { ReactionBar } from "./ReactionBar";
import type { Comment } from "./types";

export function CommentList({ postId, syncTick, refreshPost }: { postId: string; syncTick: number; refreshPost: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const nextComments = await listComments(postId);
    setComments(nextComments);
    setError("");
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [postId]);

  useEffect(() => {
    if (!content.trim() && document.activeElement?.tagName.toLowerCase() !== "input") {
      load().catch((err: Error) => setError(err.message));
    }
  }, [syncTick]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createComment(postId, content);
      setContent("");
      await load();
      refreshPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được comment");
    } finally {
      setSaving(false);
    }
  }

  async function remove(commentId: string) {
    await deleteComment(commentId);
    await load();
    refreshPost();
  }

  return (
    <div className="comments">
      {error && <ErrorMessage message={error} />}
      {comments.map((comment) => (
        <div className="comment" key={comment.id}>
          <div className="row between">
            <strong>{comment.author.displayName}</strong>
            <span className="muted">{displayTime(comment.createdAt)}</span>
          </div>
          <p>{comment.content}</p>
          <div className="row between">
            <ReactionBar targetType="COMMENT" targetId={comment.id} summary={comment.reactionSummary} myReaction={comment.myReaction} onChanged={load} />
            {comment.canDelete && (
              <button type="button" className="link" onClick={() => remove(comment.id)}>
                Xóa
              </button>
            )}
          </div>
        </div>
      ))}
      <form className="inline-form" onSubmit={submit}>
        <input value={content} maxLength={500} onChange={(event) => setContent(event.target.value)} placeholder="Viết comment..." />
        <button type="submit" disabled={saving || !content.trim()}>Gửi</button>
      </form>
    </div>
  );
}
