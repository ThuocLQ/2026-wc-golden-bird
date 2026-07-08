import type { CurrentUser } from "./types";

const tokenKey = "lunch-board-token";
const userKey = "lunch-board-user";

export const authStore = {
  getToken() {
    return localStorage.getItem(tokenKey);
  },
  getUser(): CurrentUser | null {
    const raw = localStorage.getItem(userKey);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  },
  set(token: string, user: CurrentUser) {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(user));
  },
  setUser(user: CurrentUser) {
    localStorage.setItem(userKey, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
  },
};
