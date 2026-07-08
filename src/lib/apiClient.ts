import { authStore } from "../features/auth/authStore";
import { notifyDataChanged } from "./realtime";

export type ApiResult<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const result = await apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
  if (!path.startsWith("auth-")) {
    notifyDataChanged(path);
  }
  return result;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = authStore.getToken();
  const response = await fetch(`/.netlify/functions/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const result = (await response.json()) as ApiResult<T>;
  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") authStore.clear();
    throw new Error(result.error.message);
  }
  return result.data;
}
