-- ========== BASIS-SETUP ==========
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  last_seen_at timestamptz
);

-- ACTIVITY LOGS
create table if not exists public.activity_logs (
  id bigserial primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('login','logout','seen')),
  occurred_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.activity_logs enable row level security;

-- PROFILES Policies
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = auth_user_id);

create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = auth_user_id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

-- ACTIVITY Policies
drop policy if exists "activity_insert_own" on public.activity_logs;
drop policy if exists "activity_select_own" on public.activity_logs;

create policy "activity_insert_own"
on public.activity_logs for insert
with check (auth.uid() = auth_user_id);

create policy "activity_select_own"
on public.activity_logs for select
using (auth.uid() = auth_user_id);

-- ========== RPCs ==========
create or replace function public.touch_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set last_login_at = now(),
         last_seen_at  = now()
   where auth_user_id = auth.uid();

  insert into public.activity_logs (auth_user_id, event_type)
  values (auth.uid(), 'login');
end;
$$;

create or replace function public.touch_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set last_seen_at = now()
   where auth_user_id = auth.uid();

  insert into public.activity_logs (auth_user_id, event_type)
  values (auth.uid(), 'seen');
end;
$$;

-- ========== STORAGE POLICIES (Bucket bereits via UI erzeugt: 'userfiles') ==========
-- Bestehende Policies vorher entfernen (idempotent)
drop policy if exists "storage_read_own"   on storage.objects;
drop policy if exists "storage_write_own"  on storage.objects;
drop policy if exists "storage_update_own" on storage.objects;
drop policy if exists "storage_delete_own" on storage.objects;

-- Nur authentifizierte User, nur im eigenen Ordner <uid>/...
create policy "storage_read_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'userfiles'
  and name like (auth.uid()::text || '/%')
);

create policy "storage_write_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'userfiles'
  and name like (auth.uid()::text || '/%')
);

create policy "storage_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'userfiles'
  and name like (auth.uid()::text || '/%')
)
with check (
  bucket_id = 'userfiles'
  and name like (auth.uid()::text || '/%')
);

create policy "storage_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'userfiles'
  and name like (auth.uid()::text || '/%')
);
