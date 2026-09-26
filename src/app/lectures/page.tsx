"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownTrayIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { LectureWithUrl } from "@/lib/lectures";
import { AppHeader } from "@/components/AppHeader";
import { FileTypeIcon, FILE_TYPE_LABEL } from "@/components/FileTypeIcon";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function LecturesPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<LectureWithUrl[] | null>(null);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<LectureWithUrl | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/lectures");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setLectures(data.lectures);
    })();
  }, [router]);

  const filtered = useMemo(() => {
    if (!lectures) return [];
    const q = query.trim().toLowerCase();
    if (!q) return lectures;
    return lectures.filter((l) => l.title.toLowerCase().includes(q));
  }, [lectures, query]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <AppHeader eyebrow="Курс лекций" title="Лекции" />

      <div className="relative mb-6">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию"
          className="w-full rounded-md border border-border bg-card py-3 pr-4 pl-11 text-lg text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {lectures === null && (
        <p className="text-muted-foreground">Загрузка...</p>
      )}
      {lectures !== null && filtered.length === 0 && (
        <p className="text-muted-foreground">Ничего не найдено</p>
      )}

      <ul className="space-y-3">
        {filtered.map((l) => {
          const canPreview = l.file_type === "pdf" || l.file_type === "image";
          return (
            <li
              key={l.id}
              className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <FileTypeIcon type={l.file_type} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{l.title}</p>
                    {l.isNew && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold tracking-wide text-accent uppercase">
                        Новое
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {FILE_TYPE_LABEL[l.file_type]} · {formatDate(l.uploaded_at)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pl-[3.25rem] sm:pl-0">
                {canPreview && (
                  <button
                    onClick={() => setPreview(l)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-secondary transition hover:border-primary hover:text-primary"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Посмотреть
                  </button>
                )}
                <a
                  href={l.url}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Скачать
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-md bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-3">
              <p className="font-heading font-medium text-primary">
                {preview.title}
              </p>
              <button
                onClick={() => setPreview(null)}
                className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-muted">
              {preview.file_type === "pdf" ? (
                <iframe src={preview.url} className="h-full w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt={preview.title}
                  className="mx-auto max-h-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
