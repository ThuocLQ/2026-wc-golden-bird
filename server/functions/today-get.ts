import { requireAuth } from "../shared/auth.js";
import { getTodayDashboard } from "../shared/lunch.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    return ok(await getTodayDashboard(user.id));
  });
