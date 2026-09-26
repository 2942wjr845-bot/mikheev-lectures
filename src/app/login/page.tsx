"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Неверный пароль");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const next =
        searchParams.get("next") ??
        (data.role === "uploader" ? "/upload" : "/lectures");
      router.push(next);
      router.refresh();
    } catch {
      setError("Что-то пошло не так. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-8 shadow-sm">
        <p className="text-center text-xs font-bold tracking-[0.2em] text-secondary uppercase">
          Курс лекций
        </p>
        <h1 className="mt-2 mb-1 text-center font-heading text-2xl font-semibold text-primary">
          Михеев Сергей Евгеньевич
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Введите пароль для входа
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full rounded-md border border-border bg-background px-4 py-3 text-lg text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full cursor-pointer rounded-md bg-primary py-3 text-lg font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
