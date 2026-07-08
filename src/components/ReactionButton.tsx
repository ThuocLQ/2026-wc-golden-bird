import type { ReactionType } from "../features/feed/types";

const reactionLabels: Record<ReactionType, string> = {
  LIKE: "Like",
  LOVE: "Tim",
  ANGRY: "Phẫn nộ",
};

const reactionIcons: Record<ReactionType, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  ANGRY: "😡",
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
  return (
    <button className={`icon-button reaction ${active ? "active" : ""}`} disabled={disabled} onClick={onClick} title={reactionLabels[type]}>
      <span aria-hidden="true">{reactionIcons[type]}</span>
      <span>{count}</span>
    </button>
  );
}
