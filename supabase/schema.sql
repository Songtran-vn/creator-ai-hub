-- Creator AI Hub – cấu trúc database cho Supabase
-- Chạy toàn bộ file này một lần trong Supabase → SQL Editor → New query → Run.
-- Đổi email bên dưới thành email anh dùng để đăng nhập: tài khoản đó sẽ tự thành admin.

-- ===== Hồ sơ người dùng =====
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'blocked')),
  note text default '',
  created_at timestamptz default now()
);

-- Tiến độ học, xu, điểm, huy hiệu... của từng người (data là JSON tự do)
create table if not exists public.progress (
  user_id uuid primary key references public.profiles on delete cascade,
  data jsonb not null default '{}',
  points int not null default 0,
  coins int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  leader text not null,
  members jsonb not null default '[]',
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete set null,
  title text not null,
  description text default '',
  url text default '',
  by_name text default '',
  visible boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete set null,
  by_name text default '',
  text text not null,
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz default now()
);

-- Admin sửa được tên bài, mô tả, link video
create table if not exists public.lessons (
  day int primary key,
  title text not null,
  description text default '',
  video_url text default '',
  published boolean not null default true
);

-- Cài đặt chung: daily_code, whats_new, season_end
create table if not exists public.settings (
  key text primary key,
  value jsonb
);

-- ===== Hàm phân quyền =====
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_approved() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'approved');
$$;

-- Tự tạo hồ sơ "chờ duyệt" khi có người đăng ký; email admin được duyệt sẵn
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name, role, status)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when new.email = 'songlamchaymai@gmail.com' then 'admin' else 'member' end,
    case when new.email = 'songlamchaymai@gmail.com' then 'approved' else 'pending' end
  );
  insert into progress (user_id) values (new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Người dùng không tự đổi được role/status của mình
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and (new.role <> old.role or new.status <> old.status or new.email <> old.email) then
    raise exception 'Không có quyền đổi vai trò hoặc trạng thái';
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile();

-- Bảng xếp hạng: chỉ trả tên + điểm, không lộ email
create or replace function public.get_leaderboard() returns table (id uuid, name text, points int)
language sql security definer stable set search_path = public as $$
  select p.id, p.name, coalesce(g.points, 0)
  from profiles p left join progress g on g.user_id = p.id
  where p.status = 'approved'
  order by 3 desc limit 50;
$$;

-- ===== Row Level Security =====
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.groups enable row level security;
alter table public.projects enable row level security;
alter table public.reports enable row level security;
alter table public.lessons enable row level security;
alter table public.settings enable row level security;

drop policy if exists "profiles self or admin read" on public.profiles;
create policy "profiles self or admin read" on public.profiles for select using (id = auth.uid() or is_admin());
drop policy if exists "profiles self or admin update" on public.profiles;
create policy "profiles self or admin update" on public.profiles for update using (id = auth.uid() or is_admin());
drop policy if exists "profiles admin delete" on public.profiles;
create policy "profiles admin delete" on public.profiles for delete using (is_admin());

drop policy if exists "progress self or admin" on public.progress;
create policy "progress self or admin" on public.progress for all
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

drop policy if exists "groups read" on public.groups;
create policy "groups read" on public.groups for select using (is_approved());
drop policy if exists "groups write" on public.groups;
create policy "groups write" on public.groups for all using (is_approved()) with check (is_approved());

drop policy if exists "projects read" on public.projects;
create policy "projects read" on public.projects for select using ((visible and is_approved()) or is_admin());
drop policy if exists "projects insert" on public.projects;
create policy "projects insert" on public.projects for insert with check (user_id = auth.uid() and is_approved());
drop policy if exists "projects admin" on public.projects;
create policy "projects admin" on public.projects for update using (is_admin());
drop policy if exists "projects admin delete" on public.projects;
create policy "projects admin delete" on public.projects for delete using (is_admin() or user_id = auth.uid());

drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports for insert with check (user_id = auth.uid());
drop policy if exists "reports admin" on public.reports;
create policy "reports admin" on public.reports for all using (is_admin());

drop policy if exists "lessons read" on public.lessons;
create policy "lessons read" on public.lessons for select using (true);
drop policy if exists "lessons admin" on public.lessons;
create policy "lessons admin" on public.lessons for all using (is_admin()) with check (is_admin());

drop policy if exists "settings read" on public.settings;
-- Mật lệnh hôm nay không cho người dùng đọc thẳng, chỉ kiểm tra qua hàm check_daily_code
create policy "settings read" on public.settings for select using (key <> 'daily_code' or is_admin());

create or replace function public.check_daily_code(code text) returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select upper(value #>> '{}') = upper(trim(code)) from settings where key = 'daily_code'), false);
$$;
drop policy if exists "settings admin" on public.settings;
create policy "settings admin" on public.settings for all using (is_admin()) with check (is_admin());
