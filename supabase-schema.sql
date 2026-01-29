-- Supabase 后端初始化脚本
-- 适用于：新建项目 或 现有项目的结构更新
-- 特性：幂等执行（重复运行不会报错）

-- 0. 启用必要的扩展
create extension if not exists "pgcrypto";

-- 1. 用户信息表（扩展 auth.users）
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  email text not null,
  income numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- 2. 预算设置
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily numeric(12,2) not null,
  weekly numeric(12,2) not null,
  monthly numeric(12,2) not null,
  yearly numeric(12,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

-- 为已存在的 budgets 表添加唯一约束（如果缺失）
do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'budgets_user_id_key') then
        alter table public.budgets add constraint budgets_user_id_key unique (user_id);
    end if;
end $$;

-- 3. 交易记录
-- 创建枚举类型（安全方式）
do $$ begin
    if not exists (select 1 from pg_type where typname = 'transaction_type') then
        create type public.transaction_type as enum ('debit', 'credit', 'recurring');
    end if;
end $$;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null,
  category text not null,
  date_str text not null,
  ts timestamptz not null,
  type public.transaction_type not null,
  merchant text,
  created_at timestamptz default now()
);

-- 4. 耐用品
do $$ begin
    if not exists (select 1 from pg_type where typname = 'durable_status') then
        create type public.durable_status as enum ('Active', 'Review', 'New');
    end if;
end $$;

create table if not exists public.durable_goods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  original_price numeric(12,2) not null,
  daily_cost numeric(12,4) not null,
  used_days integer not null default 0,
  target_years numeric(6,2) not null,
  status public.durable_status not null,
  image_url text,
  created_at timestamptz default now()
);

-- 5. 账户
do $$ begin
    if not exists (select 1 from pg_type where typname = 'account_type') then
        create type public.account_type as enum ('Asset', 'Liability');
    end if;
end $$;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  balance numeric(14,2) not null,
  change_percent numeric(6,2) not null default 0,
  icon text not null,
  type public.account_type not null,
  last_four text,
  details text,
  created_at timestamptz default now()
);

-- 6. 账单
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null,
  date_str text not null,
  time_left text not null,
  icon text not null,
  due_ts timestamptz not null,
  created_at timestamptz default now()
);

-- 7. 消息
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  time_label text not null,
  icon text not null,
  color text not null,
  ts timestamptz not null default now()
);

-- 8. 开启 RLS (行级安全)
alter table public.profiles      enable row level security;
alter table public.budgets       enable row level security;
alter table public.transactions  enable row level security;
alter table public.durable_goods enable row level security;
alter table public.accounts      enable row level security;
alter table public.bills         enable row level security;
alter table public.messages      enable row level security;

-- 9. RLS 策略 (先删后建，确保更新)
-- Profiles
drop policy if exists "Profiles select own" on public.profiles;
drop policy if exists "Profiles insert own" on public.profiles;
drop policy if exists "Profiles update own" on public.profiles;

create policy "Profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "Profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "Profiles update own" on public.profiles for update using (auth.uid() = id);

-- Budgets
drop policy if exists "Budgets all own" on public.budgets;
create policy "Budgets all own" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Transactions
drop policy if exists "Transactions all own" on public.transactions;
create policy "Transactions all own" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Durable Goods
drop policy if exists "Durables all own" on public.durable_goods;
create policy "Durables all own" on public.durable_goods for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Accounts
drop policy if exists "Accounts all own" on public.accounts;
create policy "Accounts all own" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bills
drop policy if exists "Bills all own" on public.bills;
create policy "Bills all own" on public.bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Messages
drop policy if exists "Messages all own" on public.messages;
create policy "Messages all own" on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 10. 性能索引优化 (可选但推荐)
create index if not exists idx_transactions_user_ts on public.transactions(user_id, ts desc);
create index if not exists idx_bills_user_due on public.bills(user_id, due_ts asc);
create index if not exists idx_messages_user_ts on public.messages(user_id, ts desc);
