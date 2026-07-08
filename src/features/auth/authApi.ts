import { apiGet, apiPost } from "../../lib/apiClient";
import type { CurrentUser } from "./types";

export function login(email: string, pin: string) {
  return apiPost<{ token: string; user: CurrentUser }>("auth-login", { email, pin });
}

export function me() {
  return apiGet<CurrentUser>("auth-me");
}
