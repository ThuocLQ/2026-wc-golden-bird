import { authStore } from "../features/auth/authStore";
import { mockApiRequest } from "./mockApi";
import { isMockApiEnabled } from "./mockMode";
import { notifyDataChanged } from "./realtime";
import { beginMutation, endMutation } from "./apiActivity";

export type ApiResult<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  beginMutation();
  try {
    const result = await apiRequest<T>(path, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
    if (!path.startsWith("auth-")) {
      notifyDataChanged(path);
    }
    return result;
  } finally {
    endMutation();
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (isMockApiEnabled()) {
    return mockApiRequest<T>(path, init);
  }

  const token = authStore.getToken();
  const response = await fetch(`/.netlify/functions/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const result = await readApiResult<T>(response, path);
  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") authStore.clear();
    throw new Error(result.error.message);
  }
  return result.data;
}

async function readApiResult<T>(response: Response, path: string): Promise<ApiResult<T>> {
  const text = await response.text();
  if (!text) {
    return {
      success: false,
      error: {
        code: "EMPTY_RESPONSE",
        message: `API ${path} trả về response rỗng (${response.status}). Hãy chạy bằng npm run netlify:dev để có Netlify Functions.`,
      },
    } as ApiResult<T>;
  }

  try {
    return JSON.parse(text) as ApiResult<T>;
  } catch {
    return {
      success: false,
      error: {
        code: "INVALID_JSON",
        message: `API ${path} không trả về JSON hợp lệ (${response.status}).`,
      },
    } as ApiResult<T>;
  }
}
