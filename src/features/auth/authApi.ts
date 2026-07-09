import { apiGet, apiPost } from "../../lib/apiClient";
import type { CurrentUser } from "./types";

export function login(username: string) {
  return apiPost<{ token: string; user: CurrentUser }>("auth-login", { username });
}

export function me() {
  return apiGet<CurrentUser>("auth-me");
}
