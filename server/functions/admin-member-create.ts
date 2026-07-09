import { hashPin, requireAdmin } from "../shared/auth.js";
import { nowIso } from "../shared/date.js";
import { appendRow, readTable } from "../shared/googleSheets.js";
import { createId } from "../shared/ids.js";
import { ApiHandler, ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { valuesFor } from "../shared/sheetTables.js";
import { touchVersions } from "../shared/supabaseStore.js";
import type { UserRow } from "../shared/types.js";
import { memberCreateSchema } from "../shared/validation.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    await requireAdmin(event);
    const input = parseJsonBody(event.body, memberCreateSchema);
    const users = await readTable<UserRow>("users");
    if (users.some((user) => user.email.toLowerCase() === input.email)) {
      throw new ApiError("DUPLICATE_EMAIL", "Email already exists");
    }

    const now = nowIso();
    const row: UserRow = {
      id: createId("user"),
      email: input.email,
      displayName: input.displayName,
      pinHash: await hashPin(input.pin),
      role: input.role,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    await appendRow("users", valuesFor("users", row));
    await touchVersions(["members", "today"]);
    return ok({ id: row.id, email: row.email, displayName: row.displayName, role: row.role, status: row.status }, 201);
  });
