import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { handleApi, ok, parseJsonBody } from "../shared/response.js";
import { wcRequestSchema } from "../shared/validation.js";
import { closeWcRequest } from "../shared/wc.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    await requireAuth(event);
    const input = parseJsonBody(event.body, wcRequestSchema);
    return ok(await closeWcRequest(input.requestId));
  });
