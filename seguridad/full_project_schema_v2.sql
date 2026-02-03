/* =====================================================================
   TIRESIS - Esquema mínimo unificado (Web + Móvil) para Supabase
   CORREGIDO: se crea profiles antes de is_admin()
   ===================================================================== */

-- ---------------------------------------------------------------------
-- 0) Extensiones requeridas
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1) Enums del sistema
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('guard', 'admin', 'supervisor');
  end if;

  if not exists (select 1 from pg_type where typname = 'event_kind') then
    create type public.event_kind as enum ('report', 'alert', 'activity');
  end if;

  if not exists (select 1 from pg_type where typname = 'event_source') then
    create type public.event_source as enum ('mobile', 'web', 'ai', 'system');
  end if;

  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('pending', 'reviewed', 'closed', 'sent');
  end if;

  if not exists (select 1 from pg_type where typname = 'shift_status') then
    create type public.shift_status as enum ('open', 'closed');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) Trigger genérico para updated_at (NO depende de tablas)
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Tablas base (PRIMERO TABLAS, DESPUÉS funciones/policies que dependan)
-- ---------------------------------------------------------------------

/* =========================================================
   3.1) profiles
   ========================================================= */
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  document_id text not null,
  phone text null,
  role public.app_role not null default 'guard',
  is_active boolean not null default true,
  primary_site_id uuid null, -- FK se agrega después de crear sites
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_document_id_uq on public.profiles(document_id);
create index if not exists profiles_primary_site_id_idx on public.profiles(primary_site_id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();


/* =========================================================
   3.2) sites
   ========================================================= */
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sites_is_active_idx on public.sites(is_active);

drop trigger if exists trg_sites_updated_at on public.sites;
create trigger trg_sites_updated_at
before update on public.sites
for each row execute function public.set_updated_at();

-- Ahora sí, FK de profiles -> sites
do $$ begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'profiles_primary_site_fk'
      and table_schema = 'public'
      and table_name = 'profiles'
  ) then
    alter table public.profiles
      add constraint profiles_primary_site_fk
      foreign key (primary_site_id) references public.sites(id)
      on delete set null;
  end if;
end $$;


/* =========================================================
   3.3) zones
   ========================================================= */
create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  geometry jsonb not null, -- [[lat,lng],[lat,lng],...]
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists zones_site_id_idx on public.zones(site_id);
create index if not exists zones_is_active_idx on public.zones(is_active);

drop trigger if exists trg_zones_updated_at on public.zones;
create trigger trg_zones_updated_at
before update on public.zones
for each row execute function public.set_updated_at();


/* =========================================================
   3.4) shifts
   ========================================================= */
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  guard_id uuid not null references public.profiles(id) on delete restrict,
  start_at timestamptz not null default now(),
  end_at timestamptz null,
  status public.shift_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shifts_site_id_idx on public.shifts(site_id);
create index if not exists shifts_guard_id_idx on public.shifts(guard_id);
create index if not exists shifts_status_idx on public.shifts(status);

drop trigger if exists trg_shifts_updated_at on public.shifts;
create trigger trg_shifts_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();


/* =========================================================
   3.5) events
   ========================================================= */
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  zone_id uuid null references public.zones(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  shift_id uuid null references public.shifts(id) on delete set null,
  kind public.event_kind not null,
  source public.event_source not null default 'system',
  type text not null,
  status public.event_status not null default 'pending',
  short_description text not null,
  details jsonb null,
  gps_lat double precision null,
  gps_lng double precision null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_site_id_idx on public.events(site_id);
create index if not exists events_zone_id_idx on public.events(zone_id);
create index if not exists events_created_by_idx on public.events(created_by);
create index if not exists events_kind_idx on public.events(kind);
create index if not exists events_status_idx on public.events(status);
create index if not exists events_created_at_idx on public.events(created_at);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();


/* =========================================================
   3.6) event_attachments
   ========================================================= */
create table if not exists public.event_attachments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  url text not null,
  mime_type text null,
  created_at timestamptz not null default now()
);

create index if not exists event_attachments_event_id_idx
on public.event_attachments(event_id);

-- ---------------------------------------------------------------------
-- 4) AHORA SÍ: funciones helper que dependen de profiles
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'supervisor')
      and p.is_active = true
  );
$$;

-- ---------------------------------------------------------------------
-- 5) RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.zones enable row level security;
alter table public.shifts enable row level security;
alter table public.events enable row level security;
alter table public.event_attachments enable row level security;

-- ---------------------------------------------------------------------
-- 6) Policies
-- ---------------------------------------------------------------------

-- PROFILES
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

-- SITES
drop policy if exists "sites_select_all_authed" on public.sites;
create policy "sites_select_all_authed"
on public.sites for select
using (auth.role() = 'authenticated');

drop policy if exists "sites_modify_admin" on public.sites;
create policy "sites_modify_admin"
on public.sites for all
using (public.is_admin())
with check (public.is_admin());

-- ZONES
drop policy if exists "zones_select_all_authed" on public.zones;
create policy "zones_select_all_authed"
on public.zones for select
using (auth.role() = 'authenticated');

drop policy if exists "zones_modify_admin" on public.zones;
create policy "zones_modify_admin"
on public.zones for all
using (public.is_admin())
with check (public.is_admin());

-- SHIFTS
drop policy if exists "shifts_select_guard_or_admin" on public.shifts;
create policy "shifts_select_guard_or_admin"
on public.shifts for select
using (guard_id = auth.uid() or public.is_admin());

drop policy if exists "shifts_insert_own" on public.shifts;
create policy "shifts_insert_own"
on public.shifts for insert
with check (guard_id = auth.uid() or public.is_admin());

drop policy if exists "shifts_update_own_or_admin" on public.shifts;
create policy "shifts_update_own_or_admin"
on public.shifts for update
using (guard_id = auth.uid() or public.is_admin())
with check (guard_id = auth.uid() or public.is_admin());

-- EVENTS
drop policy if exists "events_select_guard_site_or_admin" on public.events;
create policy "events_select_guard_site_or_admin"
on public.events for select
using (
  public.is_admin()
  or created_by = auth.uid()
  or (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.primary_site_id is not null
        and p.primary_site_id = events.site_id
    )
  )
);

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own"
on public.events for insert
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "events_update_admin_or_creator" on public.events;
create policy "events_update_admin_or_creator"
on public.events for update
using (public.is_admin() or created_by = auth.uid())
with check (public.is_admin() or created_by = auth.uid());

drop policy if exists "events_delete_admin" on public.events;
create policy "events_delete_admin"
on public.events for delete
using (public.is_admin());

-- ATTACHMENTS
drop policy if exists "attachments_select_guard_or_admin" on public.event_attachments;
create policy "attachments_select_guard_or_admin"
on public.event_attachments for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.events e
    where e.id = event_attachments.event_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "attachments_insert_guard_or_admin" on public.event_attachments;
create policy "attachments_insert_guard_or_admin"
on public.event_attachments for insert
with check (
  public.is_admin()
  or exists (
    select 1
    from public.events e
    where e.id = event_attachments.event_id
      and e.created_by = auth.uid()
  )
);

-- ---------------------------------------------------------------------
-- 7) (Opcional) Bucket de Storage
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('tiresis-evidence', 'tiresis-evidence', false)
on conflict (id) do nothing;
