import { readTable } from "./googleSheets.js";
import type { CommentRow, ReactionRow, ReactionType, TargetType, UserRow } from "./types.js";

export type ReactionSummary = Record<ReactionType, number>;

export function emptyReactionSummary(): ReactionSummary {
  return { LIKE: 0, LOVE: 0, ANGRY: 0 };
}

export async function getFeedSupport(currentUserId: string) {
  const [users, comments, reactions] = await Promise.all([
    readTable<UserRow>("users"),
    readTable<CommentRow>("comments"),
    readTable<ReactionRow>("reactions"),
  ]);
  return { users, comments, reactions, currentUserId };
}

export function authorFor(users: UserRow[], userId: string) {
  const user = users.find((item) => item.id === userId);
  return {
    id: userId,
    displayName: user?.displayName ?? "Unknown",
  };
}

export function summarizeReactions(reactions: ReactionRow[], targetType: TargetType, targetId: string): ReactionSummary {
  const summary = emptyReactionSummary();
  for (const reaction of reactions) {
    if (reaction.targetType === targetType && reaction.targetId === targetId && reaction.status === "ACTIVE" && reaction.reactionType) {
      summary[reaction.reactionType] += 1;
    }
  }
  return summary;
}

export function myReaction(reactions: ReactionRow[], userId: string, targetType: TargetType, targetId: string): ReactionType | null {
  const reaction = reactions.find(
    (item) => item.userId === userId && item.targetType === targetType && item.targetId === targetId && item.status === "ACTIVE" && item.reactionType,
  );
  return reaction?.reactionType || null;
}
