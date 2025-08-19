-- Tabellen
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_logs (
  id bigserial primary key,
  user_id uuid not null default auth.uid(),
  event text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id bigserial primary key,
  user_id uuid not null default auth.uid(),
  title text,
  url text,
  notes text,
  created_at timestamptz not null default now()
);

-- RLS aktivieren
alter table public.profiles enable row level security;
alter table public.bookmarks enable row level security;
alter table public.auth_logs enable row level security;

-- Policies: PROFILES (User sieht/bearbeitet nur sich selbst)
create policy "select own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Policies: BOOKMARKS (nur eigene)
create policy "select own bookmarks" on public.bookmarks
  for select using (auth.uid() = user_id);

create policy "insert own bookmarks" on public.bookmarks
  for insert with check (auth.uid() = user_id);

create policy "update own bookmarks" on public.bookmarks
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own bookmarks" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- Policies: AUTH_LOGS (nur eigene Logs; kein Update/Delete nötig)
create policy "insert own logs" on public.auth_logs
  for insert with check (auth.uid() = user_id);

create policy "select own logs" on public.auth_logs
  for select using (auth.uid() = user_id);

-- Storage: Bucket muss zuerst manuell erstellt werden (Name: memories, public: false)
-- Dann Policies auf storage.objects:

-- Sicht- / Schreibrechte nur für Besitzer
create policy "memories owner can read" on storage.objects
  for select using (bucket_id = 'memories' and owner = auth.uid());

create policy "memories owner can write" on storage.objects
  for insert with check (bucket_id = 'memories' and owner = auth.uid());

create policy "memories owner can update" on storage.objects
  for update using (bucket_id = 'memories' and owner = auth.uid());

create policy "memories owner can delete" on storage.objects
  for delete using (bucket_id = 'memories' and owner = auth.uid());
