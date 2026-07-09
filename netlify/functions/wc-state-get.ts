import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { handleApi, ok } from "../shared/response.js";
import { getWcState } from "../shared/wc.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    await requireAuth(event);
    return ok(await getWcState());
  });
