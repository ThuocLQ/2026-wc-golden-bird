import type { Handler } from "@netlify/functions";
import { requireAuth } from "../shared/auth.js";
import { handleApi, ok, parseJsonBody } from "../shared/response.js";
import { wcSlotSchema } from "../shared/validation.js";
import { claimWcSlot } from "../shared/wc.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const user = await requireAuth(event);
    const input = parseJsonBody(event.body, wcSlotSchema);
    return ok(await claimWcSlot(user, input.slotNumber));
  });
