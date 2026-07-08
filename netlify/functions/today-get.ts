import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { getTodayDashboard } from "../shared/lunch.js";
import { handleApi, ok } from "../shared/response.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    return ok(await getTodayDashboard(user.id));
  });
