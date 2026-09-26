import { createClient } from "@supabase/supabase-js";

/**
 * Серверный клиент с service role ключом — работает в обход RLS.
 * Использовать ТОЛЬКО в API-роутах (route.ts), никогда в коде, идущем в браузер.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Не заданы NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const LECTURES_BUCKET = "lectures";
