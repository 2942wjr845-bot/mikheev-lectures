import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isUpload = pathname.startsWith("/upload");
  const isLectures = pathname.startsWith("/lectures");

  if (!isUpload && !isLectures) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const role = await verifySessionValue(cookie);

  const hasAccess =
    (isUpload && role === "uploader") ||
    (isLectures && (role === "reader" || role === "uploader"));

  if (!hasAccess) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/upload/:path*", "/lectures/:path*"],
};
