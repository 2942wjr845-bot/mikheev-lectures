import { DocumentTextIcon, FilmIcon, PhotoIcon } from "@heroicons/react/24/outline";
import type { FileType } from "@/lib/lectures";

const ICONS: Record<FileType, typeof DocumentTextIcon> = {
  pdf: DocumentTextIcon,
  doc: DocumentTextIcon,
  image: PhotoIcon,
  video: FilmIcon,
};

export const FILE_TYPE_LABEL: Record<FileType, string> = {
  pdf: "PDF",
  doc: "Документ",
  image: "Изображение",
  video: "Видео",
};

export function FileTypeIcon({ type }: { type: FileType }) {
  const Icon = ICONS[type];
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
      <Icon className="h-5 w-5" />
    </span>
  );
}
