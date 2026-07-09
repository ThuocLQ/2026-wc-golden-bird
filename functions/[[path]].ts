import { handler as adminMemberCreate } from "../server/functions/admin-member-create.js";
import { handler as adminMemberDisable } from "../server/functions/admin-member-disable.js";
import { handler as adminMembersList } from "../server/functions/admin-members-list.js";
import { handler as adminSetPin } from "../server/functions/admin-set-pin.js";
import { handler as authLogin } from "../server/functions/auth-login.js";
import { handler as authMe } from "../server/functions/auth-me.js";
import { handler as changesGet } from "../server/functions/changes-get.js";
import { handler as commentsCreate } from "../server/functions/comments-create.js";
import { handler as commentsDelete } from "../server/functions/comments-delete.js";
import { handler as commentsList } from "../server/functions/comments-list.js";
import { handler as emailLogsList } from "../server/functions/email-logs-list.js";
import { handler as emailSendReminder } from "../server/functions/email-send-reminder.js";
import { handler as healthGet } from "../server/functions/health-get.js";
import { handler as lunchEntryUpsert } from "../server/functions/lunch-entry-upsert.js";
import { handler as postsCreate } from "../server/functions/posts-create.js";
import { handler as postsDelete } from "../server/functions/posts-delete.js";
import { handler as postsList } from "../server/functions/posts-list.js";
import { handler as reactionsToggle } from "../server/functions/reactions-toggle.js";
import { handler as todayGet } from "../server/functions/today-get.js";
import { handler as wcRequestClose } from "../server/functions/wc-request-close.js";
import { handler as wcRequestCreate } from "../server/functions/wc-request-create.js";
import { handler as wcRequestJoin } from "../server/functions/wc-request-join.js";
import { handler as wcSlotClaim } from "../server/functions/wc-slot-claim.js";
import { handler as wcStateGet } from "../server/functions/wc-state-get.js";
import type { ApiHandler, ApiResponse } from "../server/shared/response.js";

type CloudflareContext = {
  request: Request;
  env: Record<string, string | undefined>;
  next: () => Promise<Response>;
};

type PlatformHandler = (event: {
  body: string | null;
  headers: Record<string, string>;
  httpMethod: string;
  path: string;
  queryStringParameters: Record<string, string> | null;
  rawUrl: string;
}) => Promise<ApiResponse | void>;

const handlers: Record<string, PlatformHandler> = {
  "admin-member-create": adminMemberCreate as ApiHandler,
  "admin-member-disable": adminMemberDisable as ApiHandler,
  "admin-members-list": adminMembersList as ApiHandler,
  "admin-set-pin": adminSetPin as ApiHandler,
  "auth-login": authLogin as ApiHandler,
  "auth-me": authMe as ApiHandler,
  "changes-get": changesGet as ApiHandler,
  "comments-create": commentsCreate as ApiHandler,
  "comments-delete": commentsDelete as ApiHandler,
  "comments-list": commentsList as ApiHandler,
  "email-logs-list": emailLogsList as ApiHandler,
  "email-send-reminder": emailSendReminder as ApiHandler,
  "health-get": healthGet as ApiHandler,
  "lunch-entry-upsert": lunchEntryUpsert as ApiHandler,
  "posts-create": postsCreate as ApiHandler,
  "posts-delete": postsDelete as ApiHandler,
  "posts-list": postsList as ApiHandler,
  "reactions-toggle": reactionsToggle as ApiHandler,
  "today-get": todayGet as ApiHandler,
  "wc-request-close": wcRequestClose as ApiHandler,
  "wc-request-create": wcRequestCreate as ApiHandler,
  "wc-request-join": wcRequestJoin as ApiHandler,
  "wc-slot-claim": wcSlotClaim as ApiHandler,
  "wc-state-get": wcStateGet as ApiHandler,
};

export const onRequest = async (context: CloudflareContext): Promise<Response> => {
  const url = new URL(context.request.url);
  const functionName = functionNameFromPath(url.pathname);
  if (!functionName) return context.next();

  const handler = handlers[functionName];
  if (!handler) {
    return jsonResponse({ success: false, error: { code: "NOT_FOUND", message: "Function not found" } }, 404);
  }

  installProcessEnv(context.env);
  const result = await handler({
    body: await requestBody(context.request),
    headers: headersObject(context.request.headers),
    httpMethod: context.request.method,
    path: url.pathname,
    queryStringParameters: queryObject(url.searchParams),
    rawUrl: context.request.url,
  });

  if (!result) return new Response(null, { status: 204 });
  return new Response(result.body ?? "", {
    status: result.statusCode ?? 200,
    headers: result.headers as Record<string, string>,
  });
};

function functionNameFromPath(pathname: string): string | null {
  for (const prefix of ["/api/"]) {
    if (pathname.startsWith(prefix)) return pathname.slice(prefix.length).split("/")[0] || null;
  }
  return null;
}

async function requestBody(request: Request): Promise<string | null> {
  if (request.method === "GET" || request.method === "HEAD") return null;
  const body = await request.text();
  return body || null;
}

function headersObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function queryObject(params: URLSearchParams): Record<string, string> | null {
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return Object.keys(result).length > 0 ? result : null;
}

function installProcessEnv(env: Record<string, string | undefined>): void {
  const target = globalThis as typeof globalThis & { process?: { env: Record<string, string | undefined> } };
  target.process = target.process ?? { env: {} };
  target.process.env = { ...target.process.env, ...env };
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
