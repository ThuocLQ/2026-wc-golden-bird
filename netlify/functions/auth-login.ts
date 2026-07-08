import type { Handler } from "@netlify/functions";
import { publicUser, signToken, verifyPin } from "../shared/auth.js";
import { readTable } from "../shared/googleSheets.js";
import { ApiError, handleApi, ok, parseJsonBody } from "../shared/response.js";
import type { UserRow } from "../shared/types.js";
import { loginSchema } from "../shared/validation.js";

export const handler: Handler = async (event) =>
  handleApi(async () => {
    const input = parseJsonBody(event.body, loginSchema);
    const users = await readTable<UserRow>("users");
    const user = users.find((item) => item.email.toLowerCase() === input.email);

    if (!user) throw new ApiError("UNAUTHORIZED", "Invalid email or PIN");
    if (user.status !== "ACTIVE") throw new ApiError("FORBIDDEN", "User is disabled");
    if (!(await verifyPin(input.pin, user.pinHash))) throw new ApiError("UNAUTHORIZED", "Invalid email or PIN");

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    return ok({ token, user: publicUser(user) });
  });
