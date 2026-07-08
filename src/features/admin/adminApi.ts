import { apiGet, apiPost } from "../../lib/apiClient";
import type { EmailLog, Member } from "./types";

export function listMembers() {
  return apiGet<Member[]>("admin-members-list");
}

export function createMember(input: { email: string; displayName: string; role: "ADMIN" | "MEMBER"; pin: string }) {
  return apiPost("admin-member-create", input);
}

export function disableMember(userId: string) {
  return apiPost("admin-member-disable", { userId });
}

export function setPin(userId: string, pin: string) {
  return apiPost("admin-set-pin", { userId, pin });
}

export function sendReminder() {
  return apiPost<{ sentCount: number; failedCount: number; results: Array<{ email: string; status: string; errorMessage?: string }> }>("email-send-reminder");
}

export function listEmailLogs() {
  return apiGet<EmailLog[]>("email-logs-list");
}
