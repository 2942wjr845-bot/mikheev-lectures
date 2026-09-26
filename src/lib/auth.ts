import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "mikheev_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

export type Role = "uploader" | "reader";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET не задан в переменных окружения");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return toHex(signature);
}

export async function createSessionValue(role: Role): Promise<string> {
  const signature = await sign(role);
  return `${role}.${signature}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifySessionValue(
  value: string | undefined | null
): Promise<Role | null> {
  if (!value) return null;
  const dotIndex = value.indexOf(".");
  if (dotIndex === -1) return null;
  const role = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);
  if (role !== "uploader" && role !== "reader") return null;
  const expected = await sign(role);
  if (!timingSafeEqual(expected, signature)) return null;
  return role;
}

/** Проверяет роль в API-роутах. Возвращает роль или готовый ответ 401. */
export async function requireRole(
  request: NextRequest,
  allowed: Role[]
): Promise<{ role: Role } | { response: NextResponse }> {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const role = await verifySessionValue(cookie);
  if (!role || !allowed.includes(role)) {
    return {
      response: NextResponse.json({ error: "Нет доступа" }, { status: 401 }),
    };
  }
  return { role };
}
