import { schedule, type Handler } from "@netlify/functions";
import { reminderEnabled, sendReminderEmails } from "../shared/reminders.js";
import { handleApi, ok } from "../shared/response.js";

const scheduledHandler: Handler = async () =>
  handleApi(async () => {
    if (!(await reminderEnabled())) {
      return ok({ skipped: true, reason: "reminder disabled" });
    }
    return ok(await sendReminderEmails());
  });

export const handler = schedule("30 3 * * 1-5", scheduledHandler);
