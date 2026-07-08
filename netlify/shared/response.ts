import type { HandlerResponse } from "@netlify/functions";
import { ZodError } from "zod";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_EMAIL"
  | "SHEET_ERROR"
  | "EMAIL_SEND_FAILED"
  | "INTERNAL_ERROR";

const statusByCode: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  DUPLICATE_EMAIL: 409,
  SHEET_ERROR: 502,
  EMAIL_SEND_FAILED: 502,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode = statusByCode[code],
  ) {
    super(message);
  }
}

export function ok<T>(data: T, statusCode = 200): HandlerResponse {
  return json({ success: true, data }, statusCode);
}

export function fail(code: ErrorCode, message: string, statusCode = statusByCode[code]): HandlerResponse {
  return json({ success: false, error: { code, message } }, statusCode);
}

export function json(body: unknown, statusCode = 200): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

export function noContent(): HandlerResponse {
  return { statusCode: 204, body: "" };
}

export function parseJsonBody<T>(body: string | null | undefined, schema: { parse: (input: unknown) => T }): T {
  try {
    return schema.parse(body ? JSON.parse(body) : {});
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError("VALIDATION_ERROR", "Invalid JSON body");
    }
    throw error;
  }
}

export async function handleApi(action: () => Promise<HandlerResponse>): Promise<HandlerResponse> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.statusCode);
    }
    if (error instanceof ZodError) {
      return fail("VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid request");
    }
    console.error(error);
    return fail("INTERNAL_ERROR", "Something went wrong");
  }
}
