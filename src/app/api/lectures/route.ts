import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin, LECTURES_BUCKET } from "@/lib/supabase/admin";
import { detectFileType, isNewLecture, type LectureWithUrl } from "@/lib/lectures";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 4; // 4 часа

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["uploader", "reader"]);
  if ("response" in auth) return auth.response;

  const admin = getSupabaseAdmin();
  const { data: rows, error } = await admin
    .from("lectures")
    .select("id, title, file_url, file_type, original_filename, uploaded_at")
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Не удалось загрузить список лекций" },
      { status: 500 }
    );
  }

  const now = Date.now();
  const lectures: LectureWithUrl[] = [];

  for (const row of rows ?? []) {
    const { data: signed } = await admin.storage
      .from(LECTURES_BUCKET)
      .createSignedUrl(row.file_url, SIGNED_URL_TTL_SECONDS, {
        download: row.original_filename,
      });

    lectures.push({
      id: row.id,
      title: row.title,
      file_type: row.file_type,
      original_filename: row.original_filename,
      uploaded_at: row.uploaded_at,
      url: signed?.signedUrl ?? "",
      isNew: isNewLecture(row.uploaded_at, now),
    });
  }

  return NextResponse.json({ lectures });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["uploader"]);
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const path = typeof body?.path === "string" ? body.path : "";
  const originalFilename =
    typeof body?.originalFilename === "string" ? body.originalFilename : "";

  if (!title) {
    return NextResponse.json({ error: "Укажите название лекции" }, { status: 400 });
  }
  if (!path || !originalFilename) {
    return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });
  }

  const fileType = detectFileType(originalFilename);
  if (!fileType) {
    return NextResponse.json(
      { error: "Неподдерживаемый формат файла" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("lectures")
    .insert({
      title,
      file_url: path,
      file_type: fileType,
      original_filename: originalFilename,
    })
    .select("id")
    .single();

  if (error || !data) {
    // Загруженный файл больше не нужен, если запись не удалось создать
    await admin.storage.from(LECTURES_BUCKET).remove([path]);
    return NextResponse.json(
      { error: "Не удалось сохранить лекцию" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
