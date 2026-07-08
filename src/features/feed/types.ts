export type ReactionType = "LIKE" | "LOVE" | "ANGRY";
export type TargetType = "POST" | "COMMENT";

export type ReactionSummary = Record<ReactionType, number>;

export type FeedAuthor = {
  id: string;
  displayName: string;
};

export type Post = {
  id: string;
  lunchDate: string;
  author: FeedAuthor;
  content: string;
  reactionSummary: ReactionSummary;
  myReaction: ReactionType | null;
  commentCount: number;
  comments: Comment[];
  createdAt: string;
  canDelete: boolean;
};

export type Comment = {
  id: string;
  postId: string;
  author: FeedAuthor;
  content: string;
  reactionSummary: ReactionSummary;
  myReaction: ReactionType | null;
  createdAt: string;
  canDelete: boolean;
};
