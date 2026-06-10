create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  diet text,
  allergies text,
  photo_url text,
  addresses jsonb not null default '[]'::jsonb,
  payments jsonb not null default '[]'::jsonb,
  points integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  image text,
  delivery_fee numeric(8, 2) not null default 1.50,
  created_at timestamptz not null default now()
);

create table if not exists public.dishes (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(8, 2) not null,
  rating numeric(3, 1) not null default 0,
  time text not null default '25-35min',
  image text not null default '',
  description text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  allergens jsonb not null default '[]'::jsonb,
  nutrition jsonb not null default '{}'::jsonb,
  available boolean not null default true,
  extras jsonb not null default '[]'::jsonb,
  restaurant text not null,
  portions text not null default '',
  customizations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  created_at_app timestamptz,
  estimated_delivery_minutes integer,
  restaurant text,
  status text not null check (status in ('Recebido', 'Em preparação', 'A caminho', 'Entregue', 'Cancelado')),
  items jsonb not null default '[]'::jsonb,
  points_used integer not null default 0,
  points_earned integer not null default 0,
  delivery_fee numeric(8, 2),
  total numeric(8, 2) not null default 0,
  rated boolean not null default false,
  rating integer,
  review_comment text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.restaurants enable row level security;
alter table public.dishes enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
on public.orders for select
using ((select auth.uid()) = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
on public.orders for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own"
on public.orders for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "restaurants_public_read" on public.restaurants;
create policy "restaurants_public_read"
on public.restaurants for select
using (true);

drop policy if exists "dishes_public_read" on public.dishes;
create policy "dishes_public_read"
on public.dishes for select
using (true);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_created_at_app_idx on public.orders(created_at_app desc);
create index if not exists dishes_restaurant_idx on public.dishes(restaurant);
create index if not exists dishes_category_idx on public.dishes(category);
