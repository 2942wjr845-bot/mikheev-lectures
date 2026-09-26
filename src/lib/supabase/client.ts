import { createClient } from "@supabase/supabase-js";

/**
 * Браузерный клиент с публичным anon-ключом.
 * Используется только для загрузки файла по подписанной ссылке
 * (uploadToSignedUrl) — сама операция авторизована токеном, а не ключом.
 */
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Не заданы NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
