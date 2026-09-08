-- ============================================================================
-- EcoLift Launch-Ready Database Schema & Security Infrastructure
-- Run this script in the Supabase SQL Editor (Project Settings -> SQL Editor)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------

do $$ begin
  create type public.user_role as enum ('customer', 'collector', 'recycling_organisation', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.user_role add value if not exists 'recycling_organisation';
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.waste_type as enum ('household', 'recyclables', 'commercial', 'bulk_construction', 'organic', 'e_waste');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'matching', 'confirmed', 'en_route', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_status as enum ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method_type as enum ('cash', 'momo', 'card', 'wallet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_status as enum ('pending', 'successful', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_type as enum ('credit', 'debit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Core Tables
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  role public.user_role not null default 'customer',
  avatar_url text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  balance numeric(12, 2) not null default 0.00 check (balance >= 0),
  currency text not null default 'GHS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  type public.transaction_type not null,
  status public.transaction_status not null default 'pending',
  description text,
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type public.payment_method_type not null default 'momo',
  label text,
  details jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  capacity_kg int,
  base_price numeric(12, 2) not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.collectors (
  id uuid references public.profiles(id) on delete cascade primary key,
  vehicle_type_id uuid references public.vehicle_types(id),
  vehicle_name text,
  plate_number text,
  rating numeric(3, 2) not null default 5.00,
  total_jobs int not null default 0,
  is_online boolean not null default false,
  is_verified boolean not null default false,
  id_front_url text,
  id_back_url text,
  current_lat double precision,
  current_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade not null,
  collector_id uuid references public.profiles(id) on delete set null,
  vehicle_type_id uuid references public.vehicle_types(id),
  waste_type public.waste_type not null default 'household',
  pickup_lat double precision,
  pickup_lng double precision,
  pickup_address text,
  pickup_date timestamptz,
  bags_count int not null default 1,
  price numeric(12, 2) not null default 0,
  status public.order_status not null default 'pending',
  payment_method public.payment_method_type not null default 'cash',
  rating int,
  review text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collector_jobs (
  id uuid primary key default gen_random_uuid(),
  collector_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  waste_type public.waste_type not null default 'household',
  pickup_address text,
  fare numeric(12, 2) not null default 0,
  status public.job_status not null default 'pending',
  rating int,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduled_pickups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  frequency text not null default 'weekly',
  days text[] not null default '{}',
  address text,
  waste_type public.waste_type not null default 'household',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null default 'system',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  message text not null,
  status public.ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. Performance Indexes
-- ----------------------------------------------------------------------------

create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_collector_id on public.orders(collector_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_unassigned on public.orders(status, collector_id) where collector_id is null;

create index if not exists idx_collector_jobs_collector_id on public.collector_jobs(collector_id);
create index if not exists idx_collector_jobs_order_id on public.collector_jobs(order_id);
create index if not exists idx_collector_jobs_status on public.collector_jobs(status);

create index if not exists idx_collectors_online_verified on public.collectors(is_online, is_verified);

create index if not exists idx_wallet_transactions_user_id on public.wallet_transactions(user_id);
create index if not exists idx_wallet_transactions_wallet_id on public.wallet_transactions(wallet_id);

create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read);
create index if not exists idx_scheduled_pickups_user on public.scheduled_pickups(user_id, enabled);

create index if not exists idx_support_tickets_user on public.support_tickets(user_id, status);
create index if not exists idx_chat_messages_order on public.chat_messages(order_id);
create index if not exists idx_chat_messages_recipient on public.chat_messages(recipient_id, is_read);

-- ----------------------------------------------------------------------------
-- 4. Triggers & Automation
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case
      when new.raw_user_meta_data->>'role' in ('customer', 'collector', 'recycling_organisation', 'admin')
        then (new.raw_user_meta_data->>'role')::public.user_role
      else 'customer'::public.user_role
    end
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Repair profiles for users created before the auth trigger was installed.
-- This runs with definer privileges, but always uses auth.uid() as the profile id.
drop function if exists public.ensure_my_profile(text, text);

create or replace function public.ensure_my_profile(
  p_full_name text default '',
  p_phone text default null,
  p_role public.user_role default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_profile public.profiles;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_email from auth.users where id = v_user_id;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    v_user_id,
    coalesce(v_email, ''),
    coalesce(nullif(trim(p_full_name), ''), ''),
    p_phone,
    coalesce(
      p_role,
      case
        when (select raw_user_meta_data->>'role' from auth.users where id = v_user_id)
          in ('customer', 'collector', 'recycling_organisation', 'admin')
          then ((select raw_user_meta_data->>'role' from auth.users where id = v_user_id))::public.user_role
        else 'customer'::public.user_role
      end
    )
  )
  on conflict (id) do update
  set full_name = case
        when trim(excluded.full_name) <> '' then excluded.full_name
        else public.profiles.full_name
      end,
      phone = coalesce(excluded.phone, public.profiles.phone),
      updated_at = now()
  returning * into v_profile;

  insert into public.wallets (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  return v_profile;
end;
$$;

revoke all on function public.ensure_my_profile(text, text, public.user_role) from public;
grant execute on function public.ensure_my_profile(text, text, public.user_role) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Public clients may edit profile details, never their authorization role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an administrator can change account roles';
    end if;
    if new.email is distinct from old.email or new.is_verified is distinct from old.is_verified then
      raise exception 'Email and verification fields are server controlled';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute procedure public.protect_profile_role();

-- Customers cannot assign collectors or alter lifecycle/payment values from the client.
create or replace function public.protect_customer_order_updates()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() = old.customer_id and not public.is_admin() then
    if new.collector_id is distinct from old.collector_id
      or new.status is distinct from old.status
      or new.price is distinct from old.price
      or new.payment_method is distinct from old.payment_method then
      raise exception 'Order assignment and payment fields are server controlled';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.protect_customer_order_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.customer_id <> auth.uid() then
      raise exception 'Orders can only be created for the authenticated customer';
    end if;
    new.collector_id := null;
    new.status := 'matching';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_customer_order_insert on public.orders;
create trigger protect_customer_order_insert
before insert on public.orders
for each row execute procedure public.protect_customer_order_insert();

drop trigger if exists protect_customer_order_updates on public.orders;
create trigger protect_customer_order_updates
before update on public.orders
for each row execute procedure public.protect_customer_order_updates();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

drop trigger if exists set_wallets_updated_at on public.wallets;
create trigger set_wallets_updated_at before update on public.wallets for each row execute procedure public.set_updated_at();

drop trigger if exists set_collectors_updated_at on public.collectors;
create trigger set_collectors_updated_at before update on public.collectors for each row execute procedure public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute procedure public.set_updated_at();

drop trigger if exists set_collector_jobs_updated_at on public.collector_jobs;
create trigger set_collector_jobs_updated_at before update on public.collector_jobs for each row execute procedure public.set_updated_at();

drop trigger if exists set_scheduled_pickups_updated_at on public.scheduled_pickups;
create trigger set_scheduled_pickups_updated_at before update on public.scheduled_pickups for each row execute procedure public.set_updated_at();

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at before update on public.support_tickets for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Secure Atomic RPC Functions (Fintech & Order Operations)
-- ----------------------------------------------------------------------------

-- Helper: check if current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Resolve the private auth identifier for the name-only login form.
create or replace function public.get_login_email_by_name(p_full_name text)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where lower(trim(full_name)) = lower(trim(p_full_name))
    and trim(p_full_name) <> ''
  order by created_at asc
  limit 1;
$$;

revoke all on function public.get_login_email_by_name(text) from public;
grant execute on function public.get_login_email_by_name(text) to anon, authenticated;

-- Secure Wallet Top-Up
create or replace function public.top_up_wallet(
  p_amount numeric,
  p_description text default 'Wallet top-up',
  p_reference text default null
)
returns public.wallets
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet public.wallets;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'Top-up amount must be positive';
  end if;

  -- Lock wallet row for update
  select * into v_wallet
  from public.wallets
  where user_id = v_user_id
  for update;

  if v_wallet.id is null then
    insert into public.wallets (user_id, balance)
    values (v_user_id, p_amount)
    returning * into v_wallet;
  else
    update public.wallets
    set balance = balance + p_amount,
        updated_at = now()
    where id = v_wallet.id
    returning * into v_wallet;
  end if;

  -- Record transaction
  insert into public.wallet_transactions (
    wallet_id, user_id, amount, type, status, description, reference
  ) values (
    v_wallet.id, v_user_id, p_amount, 'credit', 'successful', p_description, p_reference
  );

  return v_wallet;
end;
$$;

-- Secure Wallet Debit
create or replace function public.debit_wallet(
  p_amount numeric,
  p_description text default 'Payment',
  p_reference text default null
)
returns public.wallets
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet public.wallets;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'Debit amount must be positive';
  end if;

  select * into v_wallet
  from public.wallets
  where user_id = v_user_id
  for update;

  if v_wallet.id is null or v_wallet.balance < p_amount then
    raise exception 'Insufficient wallet balance';
  end if;

  update public.wallets
  set balance = balance - p_amount,
      updated_at = now()
  where id = v_wallet.id
  returning * into v_wallet;

  insert into public.wallet_transactions (
    wallet_id, user_id, amount, type, status, description, reference
  ) values (
    v_wallet.id, v_user_id, p_amount, 'debit', 'successful', p_description, p_reference
  );

  return v_wallet;
end;
$$;

-- Atomic Order Acceptance by Collector
create or replace function public.accept_order(
  p_order_id uuid
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_collector_id uuid := auth.uid();
  v_order public.orders;
  v_collector_profile public.collectors;
begin
  if v_collector_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check if user is a valid collector
  select * into v_collector_profile
  from public.collectors
  where id = v_collector_id;

  if v_collector_profile.id is null then
    raise exception 'User is not a registered collector';
  end if;

  -- Lock order row
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'Order not found';
  end if;

  if v_order.collector_id is not null or v_order.status not in ('pending', 'matching') then
    raise exception 'Order is no longer available';
  end if;

  -- Update order
  update public.orders
  set collector_id = v_collector_id,
      status = 'confirmed',
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  -- Create collector job record
  insert into public.collector_jobs (
    collector_id, order_id, customer_id, waste_type, pickup_address, fare, status
  ) values (
    v_collector_id, v_order.id, v_order.customer_id, v_order.waste_type, v_order.pickup_address, v_order.price, 'accepted'
  );

  -- Send notification to customer
  insert into public.notifications (
    user_id, title, body, type
  ) values (
    v_order.customer_id,
    'Collector Assigned!',
    'A collector has accepted your waste pickup request.',
    'order'
  );

  return v_order;
end;
$$;

-- Atomic Order Completion
create or replace function public.complete_order(
  p_order_id uuid
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_collector_id uuid := auth.uid();
  v_order public.orders;
  v_wallet public.wallets;
begin
  if v_collector_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and collector_id = v_collector_id
  for update;

  if v_order.id is null then
    raise exception 'Order not found or not assigned to you';
  end if;

  if v_order.status = 'completed' then
    return v_order;
  end if;

  -- Update order
  update public.orders
  set status = 'completed',
      completed_at = now(),
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  -- Update collector job
  update public.collector_jobs
  set status = 'completed',
      completed_at = now(),
      updated_at = now()
  where order_id = p_order_id and collector_id = v_collector_id;

  -- Update collector total jobs count
  update public.collectors
  set total_jobs = total_jobs + 1,
      updated_at = now()
  where id = v_collector_id;

  -- Credit collector wallet earnings
  select * into v_wallet from public.wallets where user_id = v_collector_id for update;
  if v_wallet.id is not null then
    update public.wallets set balance = balance + v_order.price where id = v_wallet.id;
    insert into public.wallet_transactions (
      wallet_id, user_id, amount, type, status, description
    ) values (
      v_wallet.id, v_collector_id, v_order.price, 'credit', 'successful', 'Earnings from Pickup #' || substring(p_order_id::text, 1, 8)
    );
  end if;

  -- Notify customer
  insert into public.notifications (
    user_id, title, body, type
  ) values (
    v_order.customer_id,
    'Pickup Completed!',
    'Your waste pickup has been successfully completed. Thank you for using EcoLift!',
    'order'
  );

  return v_order;
end;
$$;

-- Atomic Order Cancellation (customer-initiated)
create or replace function public.cancel_order(
  p_order_id uuid
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock order row
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'Order not found';
  end if;

  -- Only the customer who created the order can cancel it
  if v_order.customer_id <> v_user_id then
    raise exception 'You can only cancel your own orders';
  end if;

  -- Only cancellable in pending/matching/confirmed states
  if v_order.status not in ('pending', 'matching', 'confirmed') then
    raise exception 'Order cannot be cancelled in its current state';
  end if;

  -- Update order
  update public.orders
  set status = 'cancelled',
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  -- Cancel any associated collector job
  update public.collector_jobs
  set status = 'cancelled',
      updated_at = now()
  where order_id = p_order_id and status not in ('completed', 'cancelled');

  -- Notify collector if one was assigned
  if v_order.collector_id is not null then
    insert into public.notifications (
      user_id, title, body, type
    ) values (
      v_order.collector_id,
      'Order Cancelled',
      'A customer has cancelled their pickup request.',
      'order'
    );
  end if;

  return v_order;
end;
$$;

-- Atomic Order Rating (customer-initiated, updates collector rating)
create or replace function public.rate_order(
  p_order_id uuid,
  p_rating int,
  p_review text default null
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  -- Lock order row
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'Order not found';
  end if;

  -- Only the customer who created the order can rate it
  if v_order.customer_id <> v_user_id then
    raise exception 'You can only rate your own orders';
  end if;

  -- Only completed orders can be rated
  if v_order.status <> 'completed' then
    raise exception 'Order must be completed before rating';
  end if;

  -- Update order
  update public.orders
  set rating = p_rating,
      review = p_review,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  -- Update collector's average rating
  if v_order.collector_id is not null then
    update public.collectors
    set rating = (
      select round(avg(rating)::numeric, 2)
      from public.orders
      where collector_id = v_order.collector_id and rating is not null
    ),
    updated_at = now()
    where id = v_order.collector_id;

    -- Update collector job rating
    update public.collector_jobs
    set rating = p_rating,
        updated_at = now()
    where order_id = p_order_id;
  end if;

  return v_order;
end;
$$;

-- Transition order to en_route (collector-initiated)
create or replace function public.set_order_en_route(
  p_order_id uuid
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_collector_id uuid := auth.uid();
  v_order public.orders;
begin
  if v_collector_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock order row, ensure it's assigned to this collector
  select * into v_order
  from public.orders
  where id = p_order_id and collector_id = v_collector_id
  for update;

  if v_order.id is null then
    raise exception 'Order not found or not assigned to you';
  end if;

  if v_order.status <> 'confirmed' then
    raise exception 'Order must be confirmed before starting the journey';
  end if;

  -- Update order
  update public.orders
  set status = 'en_route',
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  -- Update collector job
  update public.collector_jobs
  set status = 'in_progress',
      updated_at = now()
  where order_id = p_order_id and collector_id = v_collector_id;

  -- Notify customer
  insert into public.notifications (
    user_id, title, body, type
  ) values (
    v_order.customer_id,
    'Collector En Route',
    'Your collector is on the way to your pickup location.',
    'order'
  );

  return v_order;
end;
$$;

-- Find nearby online & verified collectors (geolocation matching)
create or replace function public.find_nearby_collectors(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 10
)
returns table (
  id uuid,
  vehicle_name text,
  plate_number text,
  rating numeric,
  total_jobs int,
  current_lat double precision,
  current_lng double precision,
  distance_km double precision
)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
  select
    c.id,
    c.vehicle_name,
    c.plate_number,
    c.rating,
    c.total_jobs,
    c.current_lat,
    c.current_lng,
    round(
      (6371 * acos(
        least(1, cos(radians(p_lat)) * cos(radians(c.current_lat)) * cos(radians(c.current_lng) - radians(p_lng)) + sin(radians(p_lat)) * sin(radians(c.current_lat)))
      ))::numeric, 2
    ) as distance_km
  from public.collectors c
  where c.is_online = true
    and c.is_verified = true
    and c.current_lat is not null
    and c.current_lng is not null
    and (6371 * acos(
      least(1, cos(radians(p_lat)) * cos(radians(c.current_lat)) * cos(radians(c.current_lng) - radians(p_lng)) + sin(radians(p_lat)) * sin(radians(c.current_lat)))
    )) <= p_radius_km
  order by distance_km asc;
end;
$$;

-- Get collector earnings summary
drop function if exists public.get_collector_earnings(uuid);
drop function if exists public.get_collector_earnings();

create or replace function public.get_collector_earnings(
  p_collector_id uuid default null
)
returns table (
  total_earnings numeric,
  week_earnings numeric,
  month_earnings numeric,
  total_jobs bigint,
  completed_jobs bigint
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_collector_id uuid := coalesce(p_collector_id, auth.uid());
begin
  if v_collector_id is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    coalesce((select sum(wt.amount) from public.wallet_transactions wt where wt.user_id = v_collector_id and wt.type = 'credit'), 0)::numeric as total_earnings,
    coalesce((select sum(wt.amount) from public.wallet_transactions wt where wt.user_id = v_collector_id and wt.type = 'credit' and wt.created_at >= date_trunc('week', now())), 0)::numeric as week_earnings,
    coalesce((select sum(wt.amount) from public.wallet_transactions wt where wt.user_id = v_collector_id and wt.type = 'credit' and wt.created_at >= date_trunc('month', now())), 0)::numeric as month_earnings,
    coalesce((select count(*) from public.collector_jobs cj where cj.collector_id = v_collector_id), 0)::bigint as total_jobs,
    coalesce((select count(*) from public.collector_jobs cj where cj.collector_id = v_collector_id and cj.status = 'completed'), 0)::bigint as completed_jobs;
end;
$$;

-- Admin dashboard statistics
create or replace function public.get_admin_stats()
returns table (
  total_users bigint,
  total_collectors bigint,
  total_orders bigint,
  completed_orders bigint,
  total_revenue numeric,
  pending_orders bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    (select count(*) from public.profiles) as total_users,
    (select count(*) from public.collectors) as total_collectors,
    (select count(*) from public.orders) as total_orders,
    (select count(*) from public.orders where status = 'completed') as completed_orders,
    (select coalesce(sum(price), 0) from public.orders where status = 'completed') as total_revenue,
    (select count(*) from public.orders where status in ('pending', 'matching')) as pending_orders;
end;
$$;

-- Send a chat message between customer and collector
create or replace function public.send_chat_message(
  p_order_id uuid,
  p_recipient_id uuid,
  p_message text
)
returns public.chat_messages
language plpgsql
security definer set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_msg public.chat_messages;
begin
  if v_sender_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_message is null or length(trim(p_message)) = 0 then
    raise exception 'Message cannot be empty';
  end if;

  insert into public.chat_messages (order_id, sender_id, recipient_id, message)
  values (p_order_id, v_sender_id, p_recipient_id, p_message)
  returning * into v_msg;

  return v_msg;
end;
$$;

-- Create a support ticket
create or replace function public.create_support_ticket(
  p_subject text,
  p_message text
)
returns public.support_tickets
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_ticket public.support_tickets;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_subject is null or length(trim(p_subject)) = 0 then
    raise exception 'Subject cannot be empty';
  end if;

  if p_message is null or length(trim(p_message)) = 0 then
    raise exception 'Message cannot be empty';
  end if;

  insert into public.support_tickets (user_id, subject, message)
  values (v_user_id, p_subject, p_message)
  returning * into v_ticket;

  return v_ticket;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Row Level Security & Access Control
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payment_methods enable row level security;
alter table public.vehicle_types enable row level security;
alter table public.collectors enable row level security;
alter table public.orders enable row level security;
alter table public.collector_jobs enable row level security;
alter table public.scheduled_pickups enable row level security;
alter table public.notifications enable row level security;
alter table public.support_tickets enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users" on public.profiles for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id and role = 'customer');

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());

-- Wallets (SELECT only for user; UPDATES restricted to SECURITY DEFINER RPCs)
drop policy if exists "Users can view own wallet" on public.wallets;
create policy "Users can view own wallet" on public.wallets for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own wallet" on public.wallets;
create policy "Users can insert own wallet" on public.wallets for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own wallet" on public.wallets;
-- NOTE: Balance updates must go through top_up_wallet / debit_wallet RPCs to prevent client fraud.

drop policy if exists "Admins can view all wallets" on public.wallets;
create policy "Admins can view all wallets" on public.wallets for select using (public.is_admin());

-- Wallet Transactions
drop policy if exists "Users can view own transactions" on public.wallet_transactions;
create policy "Users can view own transactions" on public.wallet_transactions for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all transactions" on public.wallet_transactions;
create policy "Admins can view all transactions" on public.wallet_transactions for select using (public.is_admin());

-- Payment Methods
drop policy if exists "Users can manage own payment methods" on public.payment_methods;
create policy "Users can manage own payment methods" on public.payment_methods for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Vehicle Types (Publicly Readable)
drop policy if exists "Vehicle types are publicly readable" on public.vehicle_types;
create policy "Vehicle types are publicly readable" on public.vehicle_types for select using (true);

-- Collectors
drop policy if exists "Collectors are publicly viewable" on public.collectors;
create policy "Collectors are publicly viewable" on public.collectors for select using (auth.uid() is not null);

drop policy if exists "Collectors can update own record" on public.collectors;
create policy "Collectors can update own record" on public.collectors for update using (auth.uid() = id);

create or replace function public.protect_collector_verification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() and new.is_verified is distinct from old.is_verified then
    raise exception 'Only an administrator can change collector verification';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_collector_verification on public.collectors;
create trigger protect_collector_verification
before update on public.collectors
for each row execute procedure public.protect_collector_verification();

drop policy if exists "Collectors can insert own record" on public.collectors;

-- Orders
drop policy if exists "Customers can view own orders" on public.orders;
create policy "Customers can view own orders" on public.orders for select using (auth.uid() = customer_id);

drop policy if exists "Customers can create own orders" on public.orders;
create policy "Customers can create own orders" on public.orders for insert with check (auth.uid() = customer_id);

drop policy if exists "Customers can update own orders" on public.orders;
create policy "Customers can update own orders" on public.orders for update using (auth.uid() = customer_id);

drop policy if exists "Collectors can view assigned orders" on public.orders;
create policy "Collectors can view assigned orders" on public.orders for select using (auth.uid() = collector_id);

drop policy if exists "Collectors can view pending unassigned orders" on public.orders;
create policy "Collectors can view pending unassigned orders" on public.orders for select using (
  collector_id is null and status in ('pending', 'matching')
);

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders" on public.orders for select using (public.is_admin());

-- Collector Jobs
drop policy if exists "Collectors can view own jobs" on public.collector_jobs;
create policy "Collectors can view own jobs" on public.collector_jobs for select using (auth.uid() = collector_id);

drop policy if exists "Collectors can manage own jobs" on public.collector_jobs;
create policy "Collectors can manage own jobs" on public.collector_jobs for all using (auth.uid() = collector_id) with check (auth.uid() = collector_id);

drop policy if exists "Customers can view jobs for their orders" on public.collector_jobs;
create policy "Customers can view jobs for their orders" on public.collector_jobs for select using (auth.uid() = customer_id);

drop policy if exists "Admins can view all jobs" on public.collector_jobs;
create policy "Admins can view all jobs" on public.collector_jobs for select using (public.is_admin());

-- Scheduled Pickups
drop policy if exists "Users can manage own schedules" on public.scheduled_pickups;
create policy "Users can manage own schedules" on public.scheduled_pickups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Users can insert own notifications" on public.notifications for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications" on public.notifications for delete using (auth.uid() = user_id);

drop policy if exists "Admins can view all notifications" on public.notifications;
create policy "Admins can view all notifications" on public.notifications for select using (public.is_admin());

-- Support Tickets
drop policy if exists "Users can view own tickets" on public.support_tickets;
create policy "Users can view own tickets" on public.support_tickets for select using (auth.uid() = user_id);

drop policy if exists "Users can create own tickets" on public.support_tickets;
create policy "Users can create own tickets" on public.support_tickets for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all tickets" on public.support_tickets;
create policy "Admins can view all tickets" on public.support_tickets for select using (public.is_admin());

drop policy if exists "Admins can update all tickets" on public.support_tickets;
create policy "Admins can update all tickets" on public.support_tickets for update using (public.is_admin());

-- Chat Messages
drop policy if exists "Users can view chat messages" on public.chat_messages;
create policy "Users can view chat messages" on public.chat_messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can send chat messages" on public.chat_messages;
create policy "Users can send chat messages" on public.chat_messages for insert with check (auth.uid() = sender_id);

drop policy if exists "Users can mark chat messages read" on public.chat_messages;
create policy "Users can mark chat messages read" on public.chat_messages for update using (auth.uid() = recipient_id);

-- ----------------------------------------------------------------------------
-- 7. Realtime Publication Setup
-- ----------------------------------------------------------------------------

do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.collector_jobs;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.collectors;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when others then null; end $$;

  -- Profile photo storage: users can only manage their own avatar directory.
  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do update set public = true;

  drop policy if exists "Users can upload own avatars" on storage.objects;
  create policy "Users can upload own avatars" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

  drop policy if exists "Users can update own avatars" on storage.objects;
  create policy "Users can update own avatars" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

  drop policy if exists "Users can delete own avatars" on storage.objects;
  create policy "Users can delete own avatars" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

do $$ begin
  alter publication supabase_realtime add table public.support_tickets;
exception when others then null; end $$;