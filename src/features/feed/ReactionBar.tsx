import { useState } from "react";
import { ReactionButton } from "../../components/ReactionButton";
import { toggleReaction } from "./feedApi";
import type { ReactionSummary, ReactionType, TargetType } from "./types";

const reactions: ReactionType[] = ["LIKE", "LOVE", "ANGRY"];

export function ReactionBar({
  targetType,
  targetId,
  summary,
  myReaction,
  onChanged,
}: {
  targetType: TargetType;
  targetId: string;
  summary: ReactionSummary;
  myReaction: ReactionType | null;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function react(type: ReactionType) {
    setSaving(true);
    try {
      await toggleReaction(targetType, targetId, type);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reaction-row">
      {reactions.map((type) => (
        <ReactionButton key={type} type={type} count={summary[type]} active={myReaction === type} disabled={saving} onClick={() => react(type)} />
      ))}
    </div>
  );
}
