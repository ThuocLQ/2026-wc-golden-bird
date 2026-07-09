import { publicUser, signToken } from "../shared/auth.js";
import { readTable } from "../shared/googleSheets.js";
import { ApiHandler, ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import type { UserRow } from "../shared/types.js";
import { loginSchema } from "../shared/validation.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const input = parseJsonBody(event.body, loginSchema);
    const username = normalizeLoginName(input.username || input.email || "");
    if (!username) throw new ApiError("VALIDATION_ERROR", "Missing username");

    const users = await readTable<UserRow>("users");
    const user = users.find((item) => matchesLoginName(item, username));

    if (!user) throw new ApiError("UNAUTHORIZED", "Không tìm thấy username");
    if (user.status !== "ACTIVE") throw new ApiError("FORBIDDEN", "User is disabled");

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    return ok({ token, user: publicUser(user) });
  });

function matchesLoginName(user: UserRow, username: string): boolean {
  const emailName = user.email.split("@")[0] ?? "";
  return [user.displayName, user.email, emailName].some((value) => normalizeLoginName(value) === username);
}

function normalizeLoginName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}
