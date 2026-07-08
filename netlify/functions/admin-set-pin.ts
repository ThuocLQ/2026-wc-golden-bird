import type { Handler } from "@netlify/functions";
import { hashPin, requireAdmin } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { readTable, updateRow } from "../shared/googleSheets.js";
import { ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import type { UserRow } from "../shared/types.js";
import { setPinSchema } from "../shared/validation.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    await requireAdmin(event);
    const input = parseJsonBody(event.body, setPinSchema);
    const users = await readTable<UserRow>("users");
    const user = users.find((item) => item.id === input.userId);
    if (!user) throw new ApiError("NOT_FOUND", "User not found");

    const updated: UserRow = { ...user, pinHash: await hashPin(input.pin), updatedAt: nowIso() };
    await updateRow("users", user.rowNumber, valuesFor("users", updated));
    return ok({ id: user.id });
  });
