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
  return <span className={`badge badge-${value.toLowerCase().replace("_", "-")}`}>{labels[value]}</span>;
}
