import { requireAdmin } from "../shared/auth.js";
import { sendReminderEmails } from "../shared/reminders.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";
import { touchVersions } from "../shared/supabaseStore.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    await requireAdmin(event);
    const result = await sendReminderEmails();
    await touchVersions(["notifications"]);
    return ok(result);
  });
