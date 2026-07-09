import { requireAuth } from "../shared/auth.js";
import { ApiHandler, handleApi, ok, parseJsonBody } from "../shared/response.js";
import { wcRequestSchema } from "../shared/validation.js";
import { joinWcRequest } from "../shared/wc.js";

export const handler: ApiHandler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, wcRequestSchema);
    return ok(await joinWcRequest(user, input.requestId));
  });
