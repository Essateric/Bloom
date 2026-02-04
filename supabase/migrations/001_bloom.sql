-- Bloom by Holli (bloom_*) schema + RLS
-- Safe to run in a shared Supabase project (does not touch non-bloom_* tables)

create extension if not exists pgcrypto;

-- 1) Profiles
create table if not exists public.bloom_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'client' check (role in ('client','admin')),
  created_at timestamptz not null default now()
);

create index if not exists bloom_profiles_email_idx on public.bloom_profiles (lower(email));

-- 2) Class types
create table if not exists public.bloom_class_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- 3) Class sessions
create table if not exists public.bloom_class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_type_id uuid not null references public.bloom_class_types(id) on delete restrict,
  title text not null,
  instructor_name text not null default 'Holli',
  starts_at timestamptz not null,
  duration_minutes int not null default 50,
  capacity int not null default 10,
  location text,
  description text,
  is_cancelled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists bloom_class_sessions_starts_at_idx on public.bloom_class_sessions (starts_at);

-- 4) Bookings
create table if not exists public.bloom_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.bloom_class_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'booked' check (status in ('booked','cancelled','waitlist')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create unique index if not exists bloom_bookings_user_session_unique
on public.bloom_bookings (user_id, session_id);

create index if not exists bloom_bookings_session_idx on public.bloom_bookings (session_id);
create index if not exists bloom_bookings_user_idx on public.bloom_bookings (user_id);

-- 5) Announcements
create table if not exists public.bloom_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bloom_announcements_created_at_idx on public.bloom_announcements (created_at desc);

-- Helper: check admin role
create or replace function public.bloom_is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.bloom_profiles p
    where p.user_id = uid
      and lower(p.role) = 'admin'
  );
$$;

-- Enable RLS
alter table public.bloom_profiles enable row level security;
alter table public.bloom_class_types enable row level security;
alter table public.bloom_class_sessions enable row level security;
alter table public.bloom_bookings enable row level security;
alter table public.bloom_announcements enable row level security;

-- bloom_profiles policies
drop policy if exists "bloom_profiles_select_own" on public.bloom_profiles;
create policy "bloom_profiles_select_own"
on public.bloom_profiles for select
to authenticated
using (user_id = auth.uid() or public.bloom_is_admin(auth.uid()));

drop policy if exists "bloom_profiles_upsert_own" on public.bloom_profiles;
create policy "bloom_profiles_upsert_own"
on public.bloom_profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "bloom_profiles_update_own" on public.bloom_profiles;
create policy "bloom_profiles_update_own"
on public.bloom_profiles for update
to authenticated
using (user_id = auth.uid() or public.bloom_is_admin(auth.uid()))
with check (user_id = auth.uid() or public.bloom_is_admin(auth.uid()));

-- bloom_class_types policies
drop policy if exists "bloom_class_types_select_auth" on public.bloom_class_types;
create policy "bloom_class_types_select_auth"
on public.bloom_class_types for select
to public
using (true);

drop policy if exists "bloom_class_types_admin_write" on public.bloom_class_types;
create policy "bloom_class_types_admin_write"
on public.bloom_class_types for all
to authenticated
using (public.bloom_is_admin(auth.uid()))
with check (public.bloom_is_admin(auth.uid()));

-- bloom_class_sessions policies
drop policy if exists "bloom_class_sessions_select_auth" on public.bloom_class_sessions;
create policy "bloom_class_sessions_select_auth"
on public.bloom_class_sessions for select
to public
using (true);

drop policy if exists "bloom_class_sessions_admin_write" on public.bloom_class_sessions;
create policy "bloom_class_sessions_admin_write"
on public.bloom_class_sessions for all
to authenticated
using (public.bloom_is_admin(auth.uid()))
with check (public.bloom_is_admin(auth.uid()));

-- bloom_bookings policies
drop policy if exists "bloom_bookings_select_own_or_admin" on public.bloom_bookings;
create policy "bloom_bookings_select_own_or_admin"
on public.bloom_bookings for select
to authenticated
using (user_id = auth.uid() or public.bloom_is_admin(auth.uid()));

drop policy if exists "bloom_bookings_insert_own" on public.bloom_bookings;
create policy "bloom_bookings_insert_own"
on public.bloom_bookings for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "bloom_bookings_update_cancel_own_or_admin" on public.bloom_bookings;
create policy "bloom_bookings_update_cancel_own_or_admin"
on public.bloom_bookings for update
to authenticated
using (user_id = auth.uid() or public.bloom_is_admin(auth.uid()))
with check (
  (public.bloom_is_admin(auth.uid()))
  OR
  (user_id = auth.uid() AND status = 'cancelled')
);

-- bloom_announcements policies
drop policy if exists "bloom_announcements_select_auth" on public.bloom_announcements;
create policy "bloom_announcements_select_auth"
on public.bloom_announcements for select
to public
using (true);

drop policy if exists "bloom_announcements_admin_write" on public.bloom_announcements;
create policy "bloom_announcements_admin_write"
on public.bloom_announcements for all
to authenticated
using (public.bloom_is_admin(auth.uid()))
with check (public.bloom_is_admin(auth.uid()));

-- Seed data (safe inserts)
insert into public.bloom_class_types (name, description)
values
  ('Pilates', 'Pilates-focused class'),
  ('Strength Training', 'Strength and conditioning'),
  ('Sculpt', 'Toned, sculpt-focused session'),
  ('Spin', 'Indoor cycling session')
on conflict (name) do nothing;

-- Create sessions for next 7 days (2 per day)
-- 09:00 and 18:00 alternating class types
with types as (
  select id, name, row_number() over (order by name) as rn
  from public.bloom_class_types
),
days as (
  select (current_date + s.i)::date as d, s.i
  from generate_series(0, 6) as s(i)
),
slots as (
  select d, i, 9 as hour, 0 as minute, 1 as slot
  from days
  union all
  select d, i, 18 as hour, 0 as minute, 2 as slot
  from days
)
insert into public.bloom_class_sessions (
  class_type_id, title, instructor_name, starts_at, duration_minutes, capacity, location, description
)
select
  (select id from types where rn = ((slots.i + slots.slot) % 4) + 1) as class_type_id,
  (select name from types where rn = ((slots.i + slots.slot) % 4) + 1) || ' Class' as title,
  'Holli' as instructor_name,
  make_timestamptz(extract(year from slots.d)::int, extract(month from slots.d)::int, extract(day from slots.d)::int, slots.hour, slots.minute, 0, 'UTC'),
  50,
  12,
  'Studio',
  'Book in to secure your spot.'
from slots
where not exists (
  select 1
  from public.bloom_class_sessions s
  where s.starts_at = make_timestamptz(extract(year from slots.d)::int, extract(month from slots.d)::int, extract(day from slots.d)::int, slots.hour, slots.minute, 0, 'UTC')
);
