import { useEffect, useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import { createPost, listPosts } from "../features/feed/feedApi";
import { PostCard } from "../features/feed/PostCard";
import type { Post } from "../features/feed/types";

export function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setPosts(await listPosts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được feed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await createPost(content);
      setContent("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <header className="page-header">
        <h1>Feed</h1>
        <button className="secondary" onClick={load}>
          Làm mới
        </button>
      </header>
      {error && <ErrorMessage message={error} />}
      <form className="panel form" onSubmit={submit}>
        <textarea value={content} maxLength={1000} onChange={(event) => setContent(event.target.value)} placeholder="Ai ăn gì, quán nào, chốt mấy giờ..." />
        <button disabled={saving || !content.trim()}>{saving ? "Đang đăng..." : "Đăng post"}</button>
      </form>
      {loading ? <Loading /> : posts.length === 0 ? <div className="notice">Chưa có post nào hôm nay.</div> : posts.map((post) => <PostCard key={post.id} post={post} onChanged={load} />)}
    </div>
  );
}
