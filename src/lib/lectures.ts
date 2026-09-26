export type FileType = "pdf" | "doc" | "image" | "video";

export type Lecture = {
  id: string;
  title: string;
  file_type: FileType;
  original_filename: string;
  uploaded_at: string;
};

export type LectureWithUrl = Lecture & {
  url: string;
  isNew: boolean;
};

const EXTENSION_MAP: Record<string, FileType> = {
  pdf: "pdf",
  doc: "doc",
  docx: "doc",
  jpg: "image",
  jpeg: "image",
  png: "image",
  mp4: "video",
};

export function detectFileType(filename: string): FileType | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return EXTENSION_MAP[ext] ?? null;
}

export const ACCEPTED_EXTENSIONS = Object.keys(EXTENSION_MAP);

export const NEW_LECTURE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 дня

export function isNewLecture(uploadedAt: string, now: number = Date.now()) {
  return now - new Date(uploadedAt).getTime() <= NEW_LECTURE_WINDOW_MS;
}
