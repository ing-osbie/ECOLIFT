-- ============================================================================
-- Migration: dispatch_tracking_migration.sql
-- Description: Complete Real-Time Dispatch and Live Tracking System for EcoLift
-- ============================================================================

-- 1. Extend enums for dispatch and tracking lifecycle
do $$ begin
  alter type public.order_status add value if not exists 'arrived';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.order_status add value if not exists 'pickup_in_progress';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.job_status add value if not exists 'offered';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.job_status add value if not exists 'en_route';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.job_status add value if not exists 'arrived';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.job_status add value if not exists 'pickup_in_progress';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.job_status add value if not exists 'declined';
exception when duplicate_object then null; end $$;

-- 2. Add columns to public.orders
alter table public.orders
  add column if not exists accepted_at timestamptz,
  add column if not exists arrived_at timestamptz,
  add column if not exists pickup_started_at timestamptz,
  add column if not exists disposal_lat double precision,
  add column if not exists disposal_lng double precision,
  add column if not exists disposal_address text;

-- 3. Add columns to public.collector_jobs
alter table public.collector_jobs
  add column if not exists accepted_at timestamptz,
  add column if not exists arrived_at timestamptz,
  add column if not exists offered_at timestamptz default now(),
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists pickup_lat double precision,
  add column if not exists pickup_lng double precision,
  add column if not exists bags_count int default 1;

-- 4. Enable Realtime on core dispatch tables
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.collector_jobs;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.collectors;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;

-- 5. RLS Updates
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users" on public.profiles
for select using (
  auth.uid() = id
  or public.is_admin()
  or exists (
    select 1 from public.orders o
    where (o.customer_id = auth.uid() and o.collector_id = public.profiles.id)
       or (o.collector_id = auth.uid() and o.customer_id = public.profiles.id)
  )
  or exists (
    select 1 from public.collector_jobs j
    where (j.customer_id = auth.uid() and j.collector_id = public.profiles.id)
       or (j.collector_id = auth.uid() and j.customer_id = public.profiles.id)
  )
);

-- RLS for collector_jobs
drop policy if exists "Collectors can view own jobs" on public.collector_jobs;
create policy "Collectors can view own jobs" on public.collector_jobs
for select using (auth.uid() = collector_id);

drop policy if exists "Collectors can manage own jobs" on public.collector_jobs;
create policy "Collectors can manage own jobs" on public.collector_jobs
for all using (auth.uid() = collector_id) with check (auth.uid() = collector_id);

drop policy if exists "Customers can view jobs for their orders" on public.collector_jobs;
create policy "Customers can view jobs for their orders" on public.collector_jobs
for select using (auth.uid() = customer_id);

drop policy if exists "Customers can create jobs for their orders" on public.collector_jobs;
create policy "Customers can create jobs for their orders" on public.collector_jobs
for insert with check (auth.uid() = customer_id);

-- 6. RPC: Dispatch Order to Eligible Online Collector
create or replace function public.dispatch_order(
  p_order_id uuid
)
returns public.collector_jobs
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_order public.orders;
  v_collector public.collectors;
  v_cust_profile public.profiles;
  v_job public.collector_jobs;
begin
  if v_caller_id is null then
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

  if v_order.collector_id is not null or v_order.status in ('confirmed', 'en_route', 'arrived', 'pickup_in_progress', 'completed', 'cancelled') then
    raise exception 'Order has already been assigned or closed';
  end if;

  -- Get customer profile info
  select * into v_cust_profile
  from public.profiles
  where id = v_order.customer_id;

  -- Ensure collectors table has any profiles with collector role
  insert into public.collectors (id, vehicle_name, plate_number, rating, is_online, is_verified)
  select p.id, 'EcoLift Standard Truck', 'GW-4582-24', 4.9, true, true
  from public.profiles p
  where p.role = 'collector'
  on conflict (id) do nothing;

  -- Find eligible online collector who hasn't already declined this order
  select c.* into v_collector
  from public.collectors c
  where c.is_online = true
    and not exists (
      select 1 from public.collector_jobs j
      where j.order_id = v_order.id
        and j.collector_id = c.id
        and j.status in ('cancelled', 'declined', 'accepted', 'in_progress', 'completed')
    )
  order by
    case
      when v_order.pickup_lat is not null and c.current_lat is not null then
        (6371 * acos(least(1, cos(radians(v_order.pickup_lat)) * cos(radians(c.current_lat)) * cos(radians(c.current_lng) - radians(v_order.pickup_lng)) + sin(radians(v_order.pickup_lat)) * sin(radians(c.current_lat)))))
      else 9999
    end asc,
    c.is_verified desc,
    c.rating desc,
    c.total_jobs desc
  limit 1;

  -- Fallback: Pick any collector in the system if none specifically marked online
  if v_collector.id is null then
    select c.* into v_collector
    from public.collectors c
    where not exists (
      select 1 from public.collector_jobs j
      where j.order_id = v_order.id
        and j.collector_id = c.id
        and j.status in ('cancelled', 'declined', 'accepted', 'in_progress', 'completed')
    )
    order by c.is_online desc, c.rating desc
    limit 1;
  end if;

  if v_collector.id is null then
    -- Keep order in matching state
    update public.orders set status = 'matching', updated_at = now() where id = p_order_id;
    return null;
  end if;

  -- Update order status to matching
  update public.orders
  set status = 'matching', updated_at = now()
  where id = p_order_id;

  -- Insert offered collector job
  insert into public.collector_jobs (
    collector_id,
    order_id,
    customer_id,
    waste_type,
    pickup_address,
    pickup_lat,
    pickup_lng,
    bags_count,
    fare,
    status,
    offered_at,
    customer_name,
    customer_phone
  ) values (
    v_collector.id,
    v_order.id,
    v_order.customer_id,
    v_order.waste_type,
    v_order.pickup_address,
    v_order.pickup_lat,
    v_order.pickup_lng,
    v_order.bags_count,
    v_order.price,
    'offered',
    now(),
    coalesce(nullif(v_cust_profile.full_name, ''), 'EcoLift Customer'),
    v_cust_profile.phone
  )
  returning * into v_job;

  -- Send notification to collector
  insert into public.notifications (
    user_id, title, body, type
  ) values (
    v_collector.id,
    'New Pickup Request! 🚛',
    'A new ' || v_order.waste_type || ' pickup is available near ' || coalesce(v_order.pickup_address, 'you') || ' for GH₵ ' || v_order.price,
    'order'
  );

  return v_job;
end;
$$;

-- 7. RPC: Atomic Accept Order
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

  -- Check/ensure user is a registered collector
  select * into v_collector_profile
  from public.collectors
  where id = v_collector_id;

  if v_collector_profile.id is null then
    insert into public.collectors (id, vehicle_name, plate_number, rating, is_online, is_verified)
    values (v_collector_id, 'EcoLift Standard Truck', 'GW-4582-24', 4.9, true, true)
    returning * into v_collector_profile;
  end if;

  -- Lock order row atomically
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

  -- Update order with accepted_at timestamp
  update public.orders
  set collector_id = v_collector_id,
      status = 'confirmed',
      accepted_at = now(),
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  -- Update or insert collector job record
  if exists (select 1 from public.collector_jobs where order_id = p_order_id and collector_id = v_collector_id) then
    update public.collector_jobs
    set status = 'accepted',
        accepted_at = now(),
        updated_at = now()
    where order_id = p_order_id and collector_id = v_collector_id;
  else
    insert into public.collector_jobs (
      collector_id, order_id, customer_id, waste_type, pickup_address, pickup_lat, pickup_lng, bags_count, fare, status, accepted_at
    ) values (
      v_collector_id, v_order.id, v_order.customer_id, v_order.waste_type, v_order.pickup_address, v_order.pickup_lat, v_order.pickup_lng, v_order.bags_count, v_order.price, 'accepted', now()
    );
  end if;

  -- Cancel any other offered jobs for this order
  update public.collector_jobs
  set status = 'cancelled', updated_at = now()
  where order_id = p_order_id and collector_id <> v_collector_id and status = 'offered';

  -- Notify customer immediately
  insert into public.notifications (
    user_id, title, body, type
  ) values (
    v_order.customer_id,
    'Collector Assigned!',
    coalesce(v_collector_profile.vehicle_name, 'A collector') || ' has accepted your pickup request and is preparing.',
    'order'
  );

  return v_order;
end;
$$;

-- 8. RPC: Set Order En Route
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

  select * into v_order
  from public.orders
  where id = p_order_id and collector_id = v_collector_id
  for update;

  if v_order.id is null then
    raise exception 'Order not found or not assigned to you';
  end if;

  update public.orders
  set status = 'en_route',
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  update public.collector_jobs
  set status = 'in_progress',
      updated_at = now()
  where order_id = p_order_id and collector_id = v_collector_id;

  insert into public.notifications (
    user_id, title, body, type
  ) values (
    v_order.customer_id,
    'Collector En Route 🚚',
    'Your collector is on the way to your pickup location.',
    'order'
  );

  return v_order;
end;
$$;

-- 9. RPC: Set Order Arrived (with server-side arrived_at timestamp)
create or replace function public.set_order_arrived(
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

  select * into v_order
  from public.orders
  where id = p_order_id and collector_id = v_collector_id
  for update;

  if v_order.id is null then
    raise exception 'Order not found or not assigned to you';
  end if;

  update public.orders
  set status = 'arrived',
      arrived_at = now(),
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  update public.collector_jobs
  set status = 'arrived',
      arrived_at = now(),
      updated_at = now()
  where order_id = p_order_id and collector_id = v_collector_id;

  insert into public.notifications (
    user_id, title, body, type
  ) values (
    v_order.customer_id,
    'Collector Has Arrived! 📍',
    'Your collector has arrived at the pickup location. 4-minute pickup timer started.',
    'order'
  );

  return v_order;
end;
$$;

-- 10. RPC: Start Pickup (pickup_in_progress)
create or replace function public.start_order_pickup(
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

  select * into v_order
  from public.orders
  where id = p_order_id and collector_id = v_collector_id
  for update;

  if v_order.id is null then
    raise exception 'Order not found or not assigned to you';
  end if;

  update public.orders
  set status = 'pickup_in_progress',
      pickup_started_at = now(),
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  update public.collector_jobs
  set status = 'pickup_in_progress',
      updated_at = now()
  where order_id = p_order_id and collector_id = v_collector_id;

  insert into public.notifications (
    user_id, title, body, type
  ) values (
    v_order.customer_id,
    'Waste Loading in Progress ♻️',
    'Collector has started loading your waste items.',
    'order'
  );

  return v_order;
end;
$$;

-- 11. RPC: Decline Job (and re-dispatch if order still needs collector)
create or replace function public.decline_job(
  p_job_id uuid
)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_collector_id uuid := auth.uid();
  v_job public.collector_jobs;
begin
  if v_collector_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_job
  from public.collector_jobs
  where id = p_job_id and collector_id = v_collector_id
  for update;

  if v_job.id is null then
    return false;
  end if;

  update public.collector_jobs
  set status = 'declined', updated_at = now()
  where id = p_job_id;

  -- Re-dispatch to another collector
  if v_job.order_id is not null then
    perform public.dispatch_order(v_job.order_id);
  end if;

  return true;
end;
$$;
