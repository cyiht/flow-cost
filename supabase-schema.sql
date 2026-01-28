-- Supabase 后端表结构与 RLS 策略

-- 1. 用户信息表（扩展 auth.users）
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  email text not null,
  income numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- 2. 预算设置
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily numeric(12,2) not null,
  weekly numeric(12,2) not null,
  monthly numeric(12,2) not null,
  yearly numeric(12,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 交易记录（对应 Transaction）
create type public.transaction_type as enum ('debit', 'credit', 'recurring');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null,
  category text not null,
  date_str text not null,
  ts timestamptz not null,
  type transaction_type not null,
  merchant text,
  created_at timestamptz default now()
);

-- 4. 耐用品（DurableGood）
create type public.durable_status as enum ('Active', 'Review', 'New');

create table public.durable_goods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  original_price numeric(12,2) not null,
  daily_cost numeric(12,4) not null,
  used_days integer not null default 0,
  target_years numeric(6,2) not null,
  status durable_status not null,
  image_url text,
  created_at timestamptz default now()
);

-- 5. 账户（Account）
create type public.account_type as enum ('Asset', 'Liability');

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  balance numeric(14,2) not null,
  change_percent numeric(6,2) not null default 0,
  icon text not null,
  type account_type not null,
  last_four text,
  details text,
  created_at timestamptz default now()
);

-- 6. 账单（Bill）
create table public.bills (
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

-- 7. 消息（Message）
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  time_label text not null,
  icon text not null,
  color text not null,
  ts timestamptz not null default now()
);

-- 8. RLS（行级安全）开启 & 策略
alter table public.profiles      enable row level security;
alter table public.budgets       enable row level security;
alter table public.transactions  enable row level security;
alter table public.durable_goods enable row level security;
alter table public.accounts      enable row level security;
alter table public.bills         enable row level security;
alter table public.messages      enable row level security;

create policy "Profiles select own" on public.profiles
  for select using (auth.uid() = id);
create policy "Profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Profiles update own" on public.profiles
  for update using (auth.uid() = id);

create policy "Budgets all own" on public.budgets
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Transactions all own" on public.transactions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Durables all own" on public.durable_goods
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Accounts all own" on public.accounts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Bills all own" on public.bills
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Messages all own" on public.messages
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

