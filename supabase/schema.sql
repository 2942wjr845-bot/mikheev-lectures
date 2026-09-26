-- Выполните этот скрипт в Supabase: SQL Editor -> New query -> Run

create table if not exists public.lectures (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  -- путь к файлу внутри бакета "lectures" (не публичная ссылка —
  -- ссылки для скачивания генерируются приложением на лету)
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'doc', 'image', 'video')),
  original_filename text not null,
  uploaded_at timestamptz not null default now()
);

-- Row Level Security включена, политик для anon/authenticated не создаём:
-- доступ к таблице есть только у сервера приложения через service_role ключ.
alter table public.lectures enable row level security;

-- Приватный бакет для файлов лекций. Публичного доступа нет —
-- ссылки на скачивание/просмотр приложение создаёт само (подписанные, временные).
insert into storage.buckets (id, name, public)
values ('lectures', 'lectures', false)
on conflict (id) do nothing;
