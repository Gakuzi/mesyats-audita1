# CRM-панель для аудита склада (Октябрь 2025)

Монорепозиторий на pnpm: backend (Express + Supabase) и placeholder для frontend.

## Пакеты

- backend — Node.js + Express + Supabase (PostgreSQL + Storage), Telegram уведомления
- frontend — будет добавлен (Vite + React + Tailwind)

## Запуск локально

1. Установите pnpm
2. В папке `backend` создайте `.env` по примеру `.env.example`
3. Установите зависимости и запустите dev:

```bash
pnpm install
pnpm --filter backend dev
```

## Деплой

- Backend: Render.com (Node 20), команда билда `pnpm --filter backend build`, старт `pnpm --filter backend start`
- Frontend: Vercel (будет добавлен)

## ENV Backend

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- BOT_TOKEN
- CHAT_ID
- INVITE_SECRET

## БД

SQL-схема: `database/schema.sql`
