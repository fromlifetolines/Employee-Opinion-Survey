import { TRPCError } from "@trpc/server";
import * as jose from "jose";
import { ENV } from "./env";

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "admin-secret-key-fallback");

/**
 * 生成管理員 JWT 令牌
 */
export async function generateAdminToken(): Promise<string> {
  const token = await new jose.SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

/**
 * 驗證管理員 JWT 令牌
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jose.jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

/**
 * 從請求頭提取管理員令牌
 */
export function extractAdminToken(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

/**
 * 驗證管理員令牌的中介軟體
 */
export async function verifyAdminMiddleware(token: string): Promise<void> {
  const isValid = await verifyAdminToken(token);
  if (!isValid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired admin token",
    });
  }
}
