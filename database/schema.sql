-- Users
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique,
  role text check (role in ('auditor','owner')),
  created_at timestamp default now()
);

-- Weeks
create table if not exists weeks (
  id serial primary key,
  title text,
  start_date date,
  end_date date,
  status text default 'draft',
  progress int default 0
);

-- Days
create table if not exists days (
  id serial primary key,
  week_id int references weeks(id),
  date date
);

-- Events
create table if not exists events (
  id uuid primary key,
  day_id int references days(id),
  type text,
  author_id uuid references users(id),
  content jsonb,
  file_urls text[],
  created_at timestamp default now()
);

-- Suggested storage bucket: audit-files with folders /audio, /photos, /documents (create via dashboard or admin API)
