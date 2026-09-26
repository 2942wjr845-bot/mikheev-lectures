"use client";

import { useRouter } from "next/navigation";

export function AppHeader({
  title,
  eyebrow,
}: {
  title: string;
  eyebrow: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="mb-10 flex items-end justify-between border-b border-border pb-5">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-primary">
          {title}
        </h1>
      </div>
      <button
        onClick={handleLogout}
        className="cursor-pointer pb-1 text-sm text-muted-foreground transition hover:text-primary"
      >
        Выйти
      </button>
    </div>
  );
}
