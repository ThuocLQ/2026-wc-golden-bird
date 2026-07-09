import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { handleApi, ok } from "../shared/response.js";
import { createWcRequest } from "../shared/wc.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    return ok(await createWcRequest(user));
  });
