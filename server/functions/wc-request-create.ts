import { requireAuth } from "../shared/auth.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";
import { createWcRequest } from "../shared/wc.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    return ok(await createWcRequest(user));
  });
