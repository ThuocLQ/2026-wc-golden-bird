import { Flame, Heart, ThumbsUp } from "lucide-react";
import type { ReactionType } from "../features/feed/types";

const reactionLabels: Record<ReactionType, string> = {
  LIKE: "Like",
  LOVE: "Tim",
  ANGRY: "Phẫn nộ",
};

const reactionIcons = {
  LIKE: ThumbsUp,
  LOVE: Heart,
  ANGRY: Flame,
};

export function ReactionButton({
  type,
  count,
  active,
  disabled,
  onClick,
}: {
  type: ReactionType;
  count: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = reactionIcons[type];
  return (
    <button type="button" className={`icon-button reaction ${active ? "active" : ""}`} disabled={disabled} onClick={onClick} title={reactionLabels[type]}>
      <Icon size={17} />
      <span>{count}</span>
    </button>
  );
}
