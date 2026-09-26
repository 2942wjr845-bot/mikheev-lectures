import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionValue,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  let role: "uploader" | "reader" | null = null;
  if (password && password === process.env.UPLOADER_PASSWORD) {
    role = "uploader";
  } else if (password && password === process.env.READER_PASSWORD) {
    role = "reader";
  }

  if (!role) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const value = await createSessionValue(role);
  const response = NextResponse.json({ role });
  response.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}
