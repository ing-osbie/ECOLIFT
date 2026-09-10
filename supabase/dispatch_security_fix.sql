-- Run after dispatch_tracking_migration.sql. This is deliberately policy-only:
-- it closes the legacy broad pending-order feed without creating competing RPCs.
drop policy if exists "Collectors can view pending unassigned orders" on public.orders;
drop policy if exists "Collectors can view offered job orders" on public.orders;
create policy "Collectors can view offered job orders" on public.orders for select using (
  exists (select 1 from public.collector_jobs j where j.order_id = orders.id and j.collector_id = auth.uid())
);
drop policy if exists "Collectors are publicly viewable" on public.collectors;
create policy "Collectors visible to assigned customers" on public.collectors for select using (
  auth.uid() = id or public.is_admin() or exists (
    select 1 from public.orders o where o.collector_id = collectors.id and o.customer_id = auth.uid()
  )
);
