import { requireAdmin } from "../shared/auth.js";
import { readTable } from "../shared/googleSheets.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";
import type { UserRow } from "../shared/types.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    await requireAdmin(event);
    const users = await readTable<UserRow>("users");
    return ok(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    );
  });
