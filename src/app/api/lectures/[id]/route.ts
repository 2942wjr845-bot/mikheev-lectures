import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin, LECTURES_BUCKET } from "@/lib/supabase/admin";
import { detectFileType } from "@/lib/lectures";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ["uploader"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const admin = getSupabaseAdmin();

  const { data: row } = await admin
    .from("lectures")
    .select("file_url")
    .eq("id", id)
    .single();

  const { error } = await admin.from("lectures").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Не удалось удалить лекцию" }, { status: 500 });
  }

  if (row?.file_url) {
    await admin.storage.from(LECTURES_BUCKET).remove([row.file_url]);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Обновление названия и/или замена файла лекции.
 * Если передан path — файл уже загружен клиентом по подписанной ссылке
 * (см. /api/lectures/upload-url), здесь мы удаляем старый файл и
 * обновляем запись в базе.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ["uploader"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : undefined;
  const path = typeof body?.path === "string" ? body.path : undefined;
  const originalFilename =
    typeof body?.originalFilename === "string" ? body.originalFilename : undefined;

  if (!title && !path) {
    return NextResponse.json({ error: "Нечего обновлять" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const update: Record<string, string> = {};
  let oldPath: string | null = null;

  if (path) {
    if (!originalFilename) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });
    }
    const fileType = detectFileType(originalFilename);
    if (!fileType) {
      return NextResponse.json(
        { error: "Неподдерживаемый формат файла" },
        { status: 400 }
      );
    }

    const { data: existing } = await admin
      .from("lectures")
      .select("file_url")
      .eq("id", id)
      .single();
    oldPath = existing?.file_url ?? null;

    update.file_url = path;
    update.file_type = fileType;
    update.original_filename = originalFilename;
  }

  if (title) {
    update.title = title;
  }

  const { error } = await admin.from("lectures").update(update).eq("id", id);
  if (error) {
    if (path) await admin.storage.from(LECTURES_BUCKET).remove([path]);
    return NextResponse.json({ error: "Не удалось обновить лекцию" }, { status: 500 });
  }

  if (oldPath) {
    await admin.storage.from(LECTURES_BUCKET).remove([oldPath]);
  }

  return NextResponse.json({ ok: true });
}
