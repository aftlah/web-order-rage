create extension if not exists "pgcrypto";

create table if not exists public.user_login_sessions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  member_id bigint,
  device_id text not null,
  user_agent text,
  ip_address text,
  geo jsonb not null default '{}'::jsonb,
  login_time timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  logout_time timestamptz
);

create unique index if not exists user_login_sessions_auth_device_uniq
on public.user_login_sessions(auth_user_id, device_id);

create index if not exists user_login_sessions_last_seen_idx
on public.user_login_sessions(last_seen_at desc);

create table if not exists public.page_access_logs (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  member_id bigint,
  device_id text not null,
  page_url text not null,
  referrer text,
  access_time timestamptz not null default now(),
  duration_ms bigint
);

create index if not exists page_access_logs_auth_time_idx
on public.page_access_logs(auth_user_id, access_time desc);

create index if not exists page_access_logs_page_time_idx
on public.page_access_logs(page_url, access_time desc);

create table if not exists public.failed_login_attempts (
  id uuid primary key default gen_random_uuid(),
  username text,
  attempt_time timestamptz not null default now(),
  ip_address text,
  user_agent text,
  failure_reason text
);

create index if not exists failed_login_attempts_time_idx
on public.failed_login_attempts(attempt_time desc);

create index if not exists failed_login_attempts_username_time_idx
on public.failed_login_attempts(username, attempt_time desc);

alter table public.user_login_sessions enable row level security;
alter table public.page_access_logs enable row level security;
alter table public.failed_login_attempts enable row level security;

drop policy if exists user_login_sessions_insert_own on public.user_login_sessions;
create policy user_login_sessions_insert_own
on public.user_login_sessions
for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists user_login_sessions_update_own on public.user_login_sessions;
create policy user_login_sessions_update_own
on public.user_login_sessions
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists user_login_sessions_select_admin on public.user_login_sessions;
create policy user_login_sessions_select_admin
on public.user_login_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.members m
    where m.auth_user_id::text = auth.uid()::text
      and lower(coalesce(m.role, '')) = 'admin'
  )
);

drop policy if exists page_access_logs_insert_own on public.page_access_logs;
create policy page_access_logs_insert_own
on public.page_access_logs
for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists page_access_logs_select_admin on public.page_access_logs;
create policy page_access_logs_select_admin
on public.page_access_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.members m
    where m.auth_user_id::text = auth.uid()::text
      and lower(coalesce(m.role, '')) = 'admin'
  )
);

drop policy if exists failed_login_attempts_insert_anon on public.failed_login_attempts;
create policy failed_login_attempts_insert_anon
on public.failed_login_attempts
for insert
to anon
with check (true);

drop policy if exists failed_login_attempts_select_admin on public.failed_login_attempts;
create policy failed_login_attempts_select_admin
on public.failed_login_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.members m
    where m.auth_user_id::text = auth.uid()::text
      and lower(coalesce(m.role, '')) = 'admin'
  )
);

