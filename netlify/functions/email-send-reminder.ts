import type { Handler } from "@netlify/functions";
import { requireAdmin } from "../shared/auth.js";
import { sendReminderEmails } from "../shared/reminders.js";
import { handleApi, ok } from "../shared/response.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    await requireAdmin(event);
    return ok(await sendReminderEmails());
  });
