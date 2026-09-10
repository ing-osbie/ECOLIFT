-- Durable notification outbox. Run after schema.sql.
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  delivered_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_tokens_user on public.push_tokens(user_id);
create index if not exists idx_notification_outbox_pending on public.notification_outbox(created_at) where delivered_at is null;

alter table public.push_tokens enable row level security;
alter table public.notification_outbox enable row level security;
drop policy if exists "Users manage their own push tokens" on public.push_tokens;
create policy "Users manage their own push tokens" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Notification outbox is deliberately server-only.

create or replace function public.enqueue_push_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notification_outbox(notification_id,user_id,title,body,payload)
  values(new.id,new.user_id,new.title,new.body,jsonb_build_object('notificationId',new.id,'type',new.type))
  on conflict (notification_id) do nothing;
  return new;
end;
$$;

drop trigger if exists enqueue_push_notification on public.notifications;
create trigger enqueue_push_notification
after insert on public.notifications
for each row execute procedure public.enqueue_push_notification();
