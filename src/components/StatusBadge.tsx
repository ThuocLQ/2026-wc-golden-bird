import { BadgeCheck, CircleDashed, Coffee, Moon, Utensils } from "lucide-react";
import type { LunchStatus } from "../features/lunch/types";

const labels: Record<LunchStatus | "ACTIVE" | "DISABLED" | "ADMIN" | "MEMBER", string> = {
  BRING_LUNCH: "Mang cơm",
  EAT_OUT: "Ăn ngoài",
  NO_LUNCH: "Không ăn",
  UNDECIDED: "Chưa quyết",
  ACTIVE: "Active",
  DISABLED: "Disabled",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export function StatusBadge({ value }: { value: keyof typeof labels }) {
  const Icon = icons[value] ?? BadgeCheck;
  return (
    <span className={`badge badge-${value.toLowerCase().replace("_", "-")}`}>
      <Icon size={13} />
      {labels[value]}
    </span>
  );
}

const icons = {
  BRING_LUNCH: Coffee,
  EAT_OUT: Utensils,
  NO_LUNCH: Moon,
  UNDECIDED: CircleDashed,
  ACTIVE: BadgeCheck,
  DISABLED: CircleDashed,
  ADMIN: BadgeCheck,
  MEMBER: BadgeCheck,
} as const;
