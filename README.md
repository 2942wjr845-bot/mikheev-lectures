# Лекции профессора Михеева

Сайт для загрузки и чтения лекций. Next.js + Supabase, бесплатный хостинг на Vercel.

## 1. Supabase

1. Зайдите на [supabase.com](https://supabase.com), создайте аккаунт и новый проект (Free tier).
2. Дождитесь, пока проект поднимется (1–2 минуты).
3. Откройте **SQL Editor** → **New query**, вставьте содержимое файла
   [`supabase/schema.sql`](./supabase/schema.sql) и нажмите **Run**.
   Это создаст таблицу `lectures` и приватный бакет `lectures` для файлов.
4. Откройте **Project Settings → Data API** и скопируйте:
   - **Project URL** → это `NEXT_PUBLIC_SUPABASE_URL`
5. Откройте **Project Settings → API Keys** и скопируйте:
   - **anon public** ключ → это `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** ключ → это `SUPABASE_SERVICE_ROLE_KEY`
     (это секретный ключ с полным доступом — никогда не публикуйте его
     и не добавляйте в переменные с префиксом `NEXT_PUBLIC_`)

## 2. Переменные окружения

Скопируйте `.env.local.example` в `.env.local` и заполните:

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — из Supabase (шаг 1)
- `UPLOADER_PASSWORD` — пароль для профессора (доступ к загрузке)
- `READER_PASSWORD` — пароль для студентов (доступ только на чтение)
- `SESSION_SECRET` — любая длинная случайная строка, например `openssl rand -hex 32`

## 3. Локальный запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:3000 — вас перенаправит на страницу входа.

## 4. Деплой на GitHub + Vercel

1. Создайте пустой репозиторий на GitHub и запушьте код:
   ```bash
   git add -A
   git commit -m "Initial version"
   git branch -M main
   git remote add origin <ссылка на ваш репозиторий>
   git push -u origin main
   ```
2. Зайдите на [vercel.com](https://vercel.com), войдите через GitHub и нажмите **Add New → Project**.
3. Выберите репозиторий — Vercel сам определит, что это Next.js.
4. В разделе **Environment Variables** добавьте все переменные из `.env.local`
   (те же имена и значения, что в шаге 2).
5. Нажмите **Deploy**. Через 1–2 минуты сайт будет доступен по ссылке вида
   `https://ваш-проект.vercel.app`.
6. Проверьте обе роли на реальном сайте: войдите с `UPLOADER_PASSWORD`,
   загрузите лекцию; затем откройте сайт в другой вкладке/браузере и
   войдите с `READER_PASSWORD`, убедитесь, что лекция видна, скачивается
   и (для PDF/картинок) открывается для просмотра.

## Как это устроено

- Один пароль в поле входа → выдаётся cookie-сессия на 30 дней (роль
  «uploader» или «reader», без email и регистрации).
- Файлы лекций загружаются из браузера напрямую в приватный бакет Supabase
  по временной подписанной ссылке — это нужно, чтобы обходить лимит
  размера запроса у серверных функций Vercel (актуально для видео).
- Ссылки на скачивание/просмотр — тоже временные подписанные ссылки,
  которые генерирует сервер при открытии страницы `/lectures`.
- Таблица `lectures` защищена Row Level Security: доступ к ней есть
  только у сервера приложения (через `service_role` ключ), напрямую из
  браузера в базу никто попасть не может.
