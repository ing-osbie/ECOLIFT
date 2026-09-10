-- Production hardening. Run after dispatch_enum_migration.sql,
-- dispatch_tracking_migration.sql, and dispatch_security_fix.sql.
-- This extends the existing dispatch model; it does not add a parallel order flow.

alter table public.collector_jobs
  add column if not exists offered_at timestamptz not null default now(),
  add column if not exists offer_expires_at timestamptz,
  add column if not exists declined_at timestamptz;

alter table public.orders
  add column if not exists arrival_wait_notified_at timestamptz;

create index if not exists idx_collector_jobs_active_collector
  on public.collector_jobs (collector_id, status)
  where status in ('offered', 'accepted', 'in_progress', 'arrived', 'pickup_in_progress');
create index if not exists idx_collector_jobs_offer_expiry
  on public.collector_jobs (offer_expires_at)
  where status = 'offered';
create index if not exists idx_orders_arrival_wait
  on public.orders (arrived_at)
  where status = 'arrived' and arrival_wait_notified_at is null;

-- Jobs are a server-controlled audit trail. Clients may read their permitted
-- rows, but all creation and lifecycle changes go through RPCs below.
drop policy if exists "Collectors can manage own jobs" on public.collector_jobs;
drop policy if exists "Collectors can write own jobs" on public.collector_jobs;

-- Internal dispatcher. It has no public execute grant; public entrypoints first
-- prove that the caller is either the owning customer or the collector declining
-- their own offer.
create or replace function public.dispatch_next_collector(p_order_id uuid)
returns public.collector_jobs
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_job public.collector_jobs;
  v_collector public.collectors;
  v_customer public.profiles;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if v_order.collector_id is not null or v_order.status in ('confirmed', 'en_route', 'arrived', 'pickup_in_progress', 'completed', 'cancelled') then
    return null;
  end if;

  -- Expire stale offers transactionally before selecting a replacement.
  update public.collector_jobs set status = 'cancelled', updated_at = now()
  where order_id = p_order_id and status = 'offered' and offer_expires_at <= now();

  select * into v_job from public.collector_jobs
  where order_id = p_order_id and status = 'offered' and offer_expires_at > now()
  order by offered_at desc limit 1;
  if v_job.id is not null then return v_job; end if;

  select c.* into v_collector
  from public.collectors c
  where c.is_online = true and c.is_verified = true
    and not exists (
      select 1 from public.collector_jobs active
      where active.collector_id = c.id
        and active.status in ('accepted', 'in_progress', 'arrived', 'pickup_in_progress')
    )
    and not exists (
      select 1 from public.collector_jobs prior
      where prior.order_id = p_order_id and prior.collector_id = c.id
        and prior.status = 'cancelled'
    )
  order by case when v_order.pickup_lat is null or c.current_lat is null or c.current_lng is null then 999999
                else 6371 * acos(least(1, cos(radians(v_order.pickup_lat)) * cos(radians(c.current_lat)) * cos(radians(c.current_lng) - radians(v_order.pickup_lng)) + sin(radians(v_order.pickup_lat)) * sin(radians(c.current_lat)))) end,
           c.rating desc, c.total_jobs asc
  limit 1 for update skip locked;

  if v_collector.id is null then
    update public.orders set status = 'pending', updated_at = now() where id = p_order_id;
    return null;
  end if;

  select * into v_customer from public.profiles where id = v_order.customer_id;
  update public.orders set status = 'matching', updated_at = now() where id = p_order_id;
  insert into public.collector_jobs (
    collector_id, order_id, customer_id, waste_type, pickup_address,
    pickup_lat, pickup_lng, bags_count, fare, status, customer_name,
    customer_phone, offered_at, offer_expires_at
  ) values (
    v_collector.id, v_order.id, v_order.customer_id, v_order.waste_type,
    v_order.pickup_address, v_order.pickup_lat, v_order.pickup_lng,
    v_order.bags_count, v_order.price, 'offered',
    coalesce(nullif(v_customer.full_name, ''), 'EcoLift Customer'),
    v_customer.phone, now(), now() + interval '45 seconds'
  ) returning * into v_job;
  insert into public.notifications(user_id, title, body, type) values (
    v_collector.id, 'New pickup request',
    'A pickup request is available near ' || coalesce(v_order.pickup_address, 'you') || '.', 'order'
  );
  return v_job;
end;
$$;

create or replace function public.dispatch_order(p_order_id uuid)
returns public.collector_jobs
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if v_order.customer_id <> auth.uid()
     and not exists (select 1 from public.collector_jobs j where j.order_id = p_order_id and j.collector_id = auth.uid() and j.status = 'cancelled') then
    raise exception 'Not authorized to dispatch this order';
  end if;
  return public.dispatch_next_collector(p_order_id);
end;
$$;

create or replace function public.accept_order(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_collector_id uuid := auth.uid(); v_order public.orders; v_job public.collector_jobs;
begin
  if v_collector_id is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.collectors where id = v_collector_id and is_online and is_verified) then
    raise exception 'Collector must be online and verified';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  select * into v_job from public.collector_jobs
    where order_id = p_order_id and collector_id = v_collector_id and status = 'offered' for update;
  if v_order.id is null or v_job.id is null or v_job.offer_expires_at <= now() then
    raise exception 'This pickup offer is no longer available';
  end if;
  if v_order.collector_id is not null or v_order.status not in ('pending', 'matching') then
    raise exception 'Order is no longer available';
  end if;
  update public.orders set collector_id = v_collector_id, status = 'confirmed', accepted_at = now(), updated_at = now()
    where id = p_order_id returning * into v_order;
  update public.collector_jobs set status = 'accepted', accepted_at = now(), updated_at = now() where id = v_job.id;
  update public.collector_jobs set status = 'cancelled', updated_at = now()
    where order_id = p_order_id and id <> v_job.id and status = 'offered';
  insert into public.notifications(user_id, title, body, type) values
    (v_order.customer_id, 'Collector found', 'Your collector accepted the pickup request.', 'order');
  return v_order;
end;
$$;

create or replace function public.set_order_en_route(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id and collector_id = auth.uid() for update;
  if v_order.id is null or v_order.status <> 'confirmed' then raise exception 'Order must be confirmed and assigned to you'; end if;
  update public.orders set status = 'en_route', updated_at = now() where id = p_order_id returning * into v_order;
  update public.collector_jobs set status = 'in_progress', updated_at = now()
    where order_id = p_order_id and collector_id = auth.uid() and status = 'accepted';
  insert into public.notifications(user_id,title,body,type) values (v_order.customer_id,'Collector en route','Your collector is on the way.','order');
  return v_order;
end;
$$;

create or replace function public.set_order_arrived(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id and collector_id = auth.uid() for update;
  if v_order.id is null or v_order.status <> 'en_route' then raise exception 'Order must be en route and assigned to you'; end if;
  update public.orders set status = 'arrived', arrived_at = now(), arrival_wait_notified_at = null, updated_at = now()
    where id = p_order_id returning * into v_order;
  update public.collector_jobs set status = 'arrived', arrived_at = now(), updated_at = now()
    where order_id = p_order_id and collector_id = auth.uid() and status = 'in_progress';
  insert into public.notifications(user_id,title,body,type) values (v_order.customer_id,'Collector arrived','Your collector has arrived. The four-minute waiting period has started.','order');
  return v_order;
end;
$$;

create or replace function public.start_order_pickup(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id and collector_id = auth.uid() for update;
  if v_order.id is null or v_order.status <> 'arrived' then raise exception 'Order must be marked arrived first'; end if;
  if v_order.arrived_at > now() - interval '4 minutes' then raise exception 'The four-minute waiting period has not ended'; end if;
  update public.orders set status = 'pickup_in_progress', pickup_started_at = now(), updated_at = now()
    where id = p_order_id returning * into v_order;
  update public.collector_jobs set status = 'pickup_in_progress', updated_at = now()
    where order_id = p_order_id and collector_id = auth.uid() and status = 'arrived';
  insert into public.notifications(user_id,title,body,type) values (v_order.customer_id,'Pickup started','Your waste is now being collected.','order');
  return v_order;
end;
$$;

create or replace function public.decline_job(p_job_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_job public.collector_jobs;
begin
  select * into v_job from public.collector_jobs where id = p_job_id and collector_id = auth.uid() for update;
  if v_job.id is null or v_job.status <> 'offered' then raise exception 'Offer is no longer available'; end if;
  update public.collector_jobs set status = 'cancelled', declined_at = now(), updated_at = now() where id = p_job_id;
  perform public.dispatch_next_collector(v_job.order_id);
  return true;
end;
$$;

create or replace function public.complete_order(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders; v_wallet public.wallets;
begin
  select * into v_order from public.orders where id = p_order_id and collector_id = auth.uid() for update;
  if v_order.id is null then raise exception 'Order not assigned to you'; end if;
  if v_order.status = 'completed' then return v_order; end if;
  if v_order.status <> 'pickup_in_progress' then raise exception 'Pickup must be in progress before completion'; end if;
  update public.orders set status = 'completed', completed_at = now(), updated_at = now()
    where id = p_order_id returning * into v_order;
  update public.collector_jobs set status = 'completed', completed_at = now(), updated_at = now()
    where order_id = p_order_id and collector_id = auth.uid() and status = 'pickup_in_progress';
  update public.collectors set total_jobs = total_jobs + 1, updated_at = now() where id = auth.uid();
  select * into v_wallet from public.wallets where user_id = auth.uid() for update;
  if v_wallet.id is not null then
    update public.wallets set balance = balance + v_order.price, updated_at = now() where id = v_wallet.id;
    insert into public.wallet_transactions(wallet_id,user_id,amount,type,status,description)
      values(v_wallet.id,auth.uid(),v_order.price,'credit','successful','Earnings from pickup #' || substring(p_order_id::text,1,8));
  end if;
  insert into public.notifications(user_id,title,body,type) values (v_order.customer_id,'Pickup completed','Your waste pickup has been completed.','order');
  return v_order;
end;
$$;

-- Called by a scheduled server job, never by a client. It expires offers,
-- offers the next eligible collector, and emits the server-authoritative wait expiry notification.
create or replace function public.process_dispatch_timeouts()
returns void language plpgsql security definer set search_path = public as $$
declare v_order_id uuid; v_order public.orders;
begin
  for v_order_id in select distinct order_id from public.collector_jobs
                    where status = 'offered' and offer_expires_at <= now() loop
    update public.collector_jobs set status = 'cancelled', updated_at = now()
      where order_id = v_order_id and status = 'offered' and offer_expires_at <= now();
    perform public.dispatch_next_collector(v_order_id);
  end loop;
  for v_order in update public.orders set arrival_wait_notified_at = now(), updated_at = now()
    where status = 'arrived' and arrived_at <= now() - interval '4 minutes' and arrival_wait_notified_at is null
    returning * loop
    insert into public.notifications(user_id,title,body,type) values
      (v_order.customer_id, 'Pickup wait complete', 'Your collector can now begin the pickup.', 'order'),
      (v_order.collector_id, 'Pickup wait complete', 'You may now begin the pickup.', 'order');
  end loop;
end;
$$;

revoke all on function public.dispatch_next_collector(uuid) from public;
revoke all on function public.process_dispatch_timeouts() from public;
revoke all on function public.dispatch_order(uuid), public.accept_order(uuid), public.set_order_en_route(uuid), public.set_order_arrived(uuid), public.start_order_pickup(uuid), public.decline_job(uuid), public.complete_order(uuid) from public;
grant execute on function public.dispatch_order(uuid), public.accept_order(uuid), public.set_order_en_route(uuid), public.set_order_arrived(uuid), public.start_order_pickup(uuid), public.decline_job(uuid) to authenticated;
grant execute on function public.complete_order(uuid) to authenticated;
grant execute on function public.process_dispatch_timeouts() to service_role;
