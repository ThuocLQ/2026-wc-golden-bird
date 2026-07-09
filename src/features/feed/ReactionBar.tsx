import { useEffect, useState } from "react";
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
  const [localSummary, setLocalSummary] = useState(summary);
  const [localReaction, setLocalReaction] = useState(myReaction);

  useEffect(() => {
    setLocalSummary(summary);
    setLocalReaction(myReaction);
  }, [summary, myReaction]);

  async function react(type: ReactionType) {
    const previousSummary = localSummary;
    const previousReaction = localReaction;
    const nextReaction = previousReaction === type ? null : type;
    setLocalReaction(nextReaction);
    setLocalSummary(applyReaction(previousSummary, previousReaction, nextReaction));
    setSaving(true);
    try {
      await toggleReaction(targetType, targetId, type);
      onChanged();
    } catch (error) {
      setLocalSummary(previousSummary);
      setLocalReaction(previousReaction);
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reaction-row">
      {reactions.map((type) => (
        <ReactionButton key={type} type={type} count={localSummary[type]} active={localReaction === type} disabled={saving} onClick={() => react(type)} />
      ))}
    </div>
  );
}

function applyReaction(summary: ReactionSummary, previous: ReactionType | null, next: ReactionType | null): ReactionSummary {
  const updated = { ...summary };
  if (previous) updated[previous] = Math.max(0, updated[previous] - 1);
  if (next) updated[next] += 1;
  return updated;
}
