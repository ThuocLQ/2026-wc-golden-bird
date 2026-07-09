import { requireAuth } from "../shared/auth.js";
import { ApiHandler, handleApi, ok } from "../shared/response.js";
import { getWcState } from "../shared/wc.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    await requireAuth(event);
    return ok(await getWcState());
  });
