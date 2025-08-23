-- ========= MASTER: Alle Kennzeichen =========
create table if not exists public.plates_de (
  code        text primary key,         -- z. B. "ABG"
  label       text not null,            -- z. B. "Altenburger Land"
  state_code  text,                     -- z. B. "TH"
  state_name  text,                     -- z. B. "Thüringen"
  is_legacy   boolean not null default false,
  created_at  timestamptz default now()
);

alter table public.plates_de enable row level security;

-- Lesen für alle angemeldeten User erlauben (kein Schreiben über anon key)
drop policy if exists "plates_de_read" on public.plates_de;
create policy "plates_de_read"
on public.plates_de
for select
to authenticated
using (true);


-- ========= PICKS: Wer hat welches Kennzeichen wann „gepickt“ =========
create table if not exists public.plate_picks (
  id          bigserial primary key,
  plate_code  text not null references public.plates_de(code) on delete restrict,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (plate_code)   -- <== ein Kennzeichen darf nur einmal global gepickt werden
);

alter table public.plate_picks enable row level security;

-- Jeder darf die Gesamtliste sehen (für Ranking/Liste)
drop policy if exists "plate_picks_select_all" on public.plate_picks;
create policy "plate_picks_select_all"
on public.plate_picks
for select
to authenticated
using (true);

-- Einfügen nur für sich selbst
drop policy if exists "plate_picks_insert_own" on public.plate_picks;
create policy "plate_picks_insert_own"
on public.plate_picks
for insert
to authenticated
with check (auth.uid() = user_id);


-- ========= RPC: Pick-Operation (validiert & liefert saubere Fehlermeldungen) =========
create or replace function public.pick_plate(p_code text)
returns table(id bigint, plate_code text, user_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.plates_de where code = v_code) then
    raise exception 'Kennzeichen % existiert nicht', v_code using errcode = 'P0001';
  end if;

  insert into public.plate_picks (plate_code, user_id)
  values (v_code, auth.uid())
  returning plate_picks.id, plate_picks.plate_code, plate_picks.user_id, plate_picks.created_at
  into id, plate_code, user_id, created_at;

  return next;

exception
  when unique_violation then
    -- Schon vergeben
    raise exception 'Kennzeichen % wurde bereits gepickt', v_code using errcode = 'P0001';
end;
$$;
