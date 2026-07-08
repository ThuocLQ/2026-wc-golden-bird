import type { Handler } from "@netlify/functions";
import { requireAdmin } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { readTable, updateRow } from "../shared/googleSheets.js";
import { ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import type { UserRow } from "../shared/types.js";
import { userIdSchema } from "../shared/validation.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const admin = await requireAdmin(event);
    const input = parseJsonBody(event.body, userIdSchema);
    if (admin.id === input.userId) throw new ApiError("VALIDATION_ERROR", "Cannot disable yourself");

    const users = await readTable<UserRow>("users");
    const user = users.find((item) => item.id === input.userId);
    if (!user) throw new ApiError("NOT_FOUND", "User not found");

    const updated: UserRow = { ...user, status: "DISABLED", updatedAt: nowIso() };
    await updateRow("users", user.rowNumber, valuesFor("users", updated));
    return ok({ id: user.id, status: "DISABLED" });
  });
