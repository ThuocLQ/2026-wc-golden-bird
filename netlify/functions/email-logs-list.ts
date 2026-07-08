import type { Handler } from "@netlify/functions";
import { requireAdmin } from "../shared/auth.js";
import { readTable } from "../shared/googleSheets.js";
import { handleApi, ok } from "../shared/response.js";
import type { EmailLogRow } from "../shared/types.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    await requireAdmin(event);
    const logs = await readTable<EmailLogRow>("email_logs");
    return ok(logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50));
  });
