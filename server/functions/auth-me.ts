import { publicUser, requireAuth } from "../shared/auth.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    return ok(publicUser(user));
  });
