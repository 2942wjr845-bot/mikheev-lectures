import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin, LECTURES_BUCKET } from "@/lib/supabase/admin";
import { detectFileType } from "@/lib/lectures";

/**
 * Возвращает подписанную ссылку для прямой загрузки файла из браузера
 * в Supabase Storage — так мы обходим лимит размера тела запроса
 * у серверных функций Vercel (важно для видео).
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["uploader"]);
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const filename = typeof body?.filename === "string" ? body.filename : "";

  const fileType = detectFileType(filename);
  if (!fileType) {
    return NextResponse.json(
      { error: "Неподдерживаемый формат файла" },
      { status: 400 }
    );
  }

  const ext = filename.split(".").pop()!.toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(LECTURES_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: "Не удалось подготовить загрузку" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
    fileType,
  });
}
