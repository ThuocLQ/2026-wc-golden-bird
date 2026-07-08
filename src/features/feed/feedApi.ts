import { apiGet, apiPost } from "../../lib/apiClient";
import type { Comment, Post, ReactionType, TargetType } from "./types";

export function listPosts(date?: string) {
  return apiGet<Post[]>(`posts-list${date ? `?date=${date}` : ""}`);
}

export function createPost(content: string) {
  return apiPost("posts-create", { content });
}

export function deletePost(postId: string) {
  return apiPost("posts-delete", { postId });
}

export function listComments(postId: string) {
  return apiGet<Comment[]>(`comments-list?postId=${postId}`);
}

export function createComment(postId: string, content: string) {
  return apiPost("comments-create", { postId, content });
}

export function deleteComment(commentId: string) {
  return apiPost("comments-delete", { commentId });
}

export function toggleReaction(targetType: TargetType, targetId: string, reactionType: ReactionType) {
  return apiPost("reactions-toggle", { targetType, targetId, reactionType });
}
