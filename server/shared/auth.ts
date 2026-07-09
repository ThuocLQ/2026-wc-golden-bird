import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { ApiError, type ApiEvent } from "./response.js";
import { findUserById } from "./supabaseStore.js";
import type { Role, UserRow } from "./types.js";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: Role;
};

const encoder = new TextEncoder();
const userCache = new Map<string, { user: UserRow; expiresAt: number }>();
const userCacheTtlMs = 30_000;

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    throw new ApiError("INTERNAL_ERROR", "Missing or weak JWT_SECRET");
  }
  return encoder.encode(secret);
}

export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}

export async function signToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<AuthTokenPayload> {
  try {
    const result = await jwtVerify(token, getJwtSecret());
    const payload = result.payload as Partial<AuthTokenPayload>;
    if (!payload.userId || !payload.email || !payload.role) {
      throw new ApiError("UNAUTHORIZED", "Invalid token");
    }
    return payload as AuthTokenPayload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("UNAUTHORIZED", "Invalid token");
  }
}

export async function requireAuth(event: ApiEvent): Promise<UserRow> {
  const header = event.headers.authorization ?? event.headers.Authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) {
    throw new ApiError("UNAUTHORIZED", "Missing token");
  }

  const payload = await verifyToken(token);
  const cached = userCache.get(payload.userId);
  const user = cached && cached.expiresAt > Date.now() ? cached.user : await findUserById(payload.userId);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "User not found");
  }
  if (user.status !== "ACTIVE") {
    userCache.delete(payload.userId);
    throw new ApiError("FORBIDDEN", "User is disabled");
  }
  userCache.set(payload.userId, { user, expiresAt: Date.now() + userCacheTtlMs });
  return user;
}

export async function requireAdmin(event: ApiEvent): Promise<UserRow> {
  const user = await requireAuth(event);
  if (user.role !== "ADMIN") {
    throw new ApiError("FORBIDDEN", "Admin only");
  }
  return user;
}

export function publicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
