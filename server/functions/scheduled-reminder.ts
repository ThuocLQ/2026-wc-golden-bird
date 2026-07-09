import { reminderEnabled, sendReminderEmails } from "../shared/reminders.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";
import { touchVersions } from "../shared/supabaseStore.js";

export const handler: ApiHandler = async () =>
  handleApi(async () => {
    if (!(await reminderEnabled())) {
      return ok({ skipped: true, reason: "reminder disabled" });
    }
    const result = await sendReminderEmails();
    await touchVersions(["notifications"]);
    return ok(result);
  });
