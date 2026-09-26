"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { ACCEPTED_EXTENSIONS, type LectureWithUrl } from "@/lib/lectures";
import { AppHeader } from "@/components/AppHeader";
import { FileTypeIcon, FILE_TYPE_LABEL } from "@/components/FileTypeIcon";

const ACCEPT_ATTR = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function uploadFile(file: File): Promise<{
  path: string;
  originalFilename: string;
}> {
  const res = await fetch("/api/lectures/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Не удалось подготовить загрузку");
  }
  const { path, token } = await res.json();

  const supabase = getSupabaseBrowser();
  const { error } = await supabase.storage
    .from("lectures")
    .uploadToSignedUrl(path, token, file);
  if (error) {
    throw new Error("Не удалось загрузить файл");
  }

  return { path, originalFilename: file.name };
}

export default function UploadPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<LectureWithUrl[] | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetId = useRef<string | null>(null);

  const fetchLectures = useCallback(async (): Promise<
    LectureWithUrl[] | "unauthorized"
  > => {
    const res = await fetch("/api/lectures");
    if (res.status === 401) return "unauthorized";
    const data = await res.json();
    return data.lectures;
  }, []);

  const loadLectures = useCallback(async () => {
    const result = await fetchLectures();
    if (result === "unauthorized") {
      router.push("/login");
      return;
    }
    setLectures(result);
  }, [fetchLectures, router]);

  useEffect(() => {
    (async () => {
      const result = await fetchLectures();
      if (result === "unauthorized") {
        router.push("/login");
        return;
      }
      setLectures(result);
    })();
  }, [fetchLectures, router]);

  function pickFile(f: File | null) {
    setError("");
    if (!f) {
      setFile(null);
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
      setError("Этот формат файла не поддерживается");
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function handlePublish() {
    if (!file || !title.trim()) return;
    setPublishing(true);
    setError("");
    try {
      const { path, originalFilename } = await uploadFile(file);
      const res = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), path, originalFilename }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Не удалось опубликовать лекцию");
      }
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadLectures();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Удалить эту лекцию без возможности восстановления?")) {
      return;
    }
    setDeletingId(id);
    try {
      await fetch(`/api/lectures/${id}`, { method: "DELETE" });
      await loadLectures();
    } finally {
      setDeletingId(null);
    }
  }

  function triggerReplace(id: string) {
    replaceTargetId.current = id;
    replaceInputRef.current?.click();
  }

  async function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    const id = replaceTargetId.current;
    e.target.value = "";
    if (!f || !id) return;

    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
      setError("Этот формат файла не поддерживается");
      return;
    }

    setReplacingId(id);
    setError("");
    try {
      const { path, originalFilename } = await uploadFile(f);
      const res = await fetch(`/api/lectures/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, originalFilename }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Не удалось заменить файл");
      }
      await loadLectures();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setReplacingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <AppHeader eyebrow="Курс лекций" title="Загрузка лекций" />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-14 text-center transition ${
          dragOver
            ? "border-primary bg-muted"
            : "border-border bg-card hover:bg-muted/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        <CloudArrowUpIcon className="mb-3 h-9 w-9 text-secondary" />
        {file ? (
          <p className="text-lg font-medium text-foreground">{file.name}</p>
        ) : (
          <>
            <p className="text-lg font-medium text-foreground">
              Перетащите файл сюда или нажмите, чтобы выбрать
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              PDF, DOC, DOCX, JPG, PNG, MP4
            </p>
          </>
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название лекции"
        className="mt-4 w-full rounded-md border border-border bg-card px-4 py-3 text-lg text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <button
        onClick={handlePublish}
        disabled={!file || !title.trim() || publishing}
        className="mt-4 w-full cursor-pointer rounded-md bg-primary py-3 text-lg font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {publishing ? "Публикуем..." : "Опубликовать"}
      </button>

      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={handleReplaceFile}
      />

      <h2 className="mt-12 mb-4 font-heading text-xl font-semibold text-primary">
        Загруженные лекции
      </h2>

      {lectures === null && (
        <p className="text-muted-foreground">Загрузка...</p>
      )}
      {lectures?.length === 0 && (
        <p className="text-muted-foreground">Пока ничего не загружено</p>
      )}

      <ul className="space-y-3">
        {lectures?.map((l) => (
          <li
            key={l.id}
            className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <FileTypeIcon type={l.file_type} />
              <div>
                <p className="font-medium text-foreground">{l.title}</p>
                <p className="text-sm text-muted-foreground">
                  {FILE_TYPE_LABEL[l.file_type]} · {formatDate(l.uploaded_at)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pl-[3.25rem] sm:pl-0">
              <button
                onClick={() => triggerReplace(l.id)}
                disabled={replacingId === l.id}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-secondary transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowPathIcon className="h-4 w-4" />
                {replacingId === l.id ? "Заменяем..." : "Заменить файл"}
              </button>
              <button
                onClick={() => handleDelete(l.id)}
                disabled={deletingId === l.id}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                {deletingId === l.id ? "Удаляем..." : "Удалить"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
