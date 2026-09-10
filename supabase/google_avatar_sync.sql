-- Migration: google_avatar_sync.sql
-- Description: Syncs Google profile picture (avatar_url / picture) from auth.users to public.profiles

-- 1. Backfill any existing users whose avatar_url is missing but present in auth.users
update public.profiles p
set avatar_url = coalesce(
  nullif(u.raw_user_meta_data->>'avatar_url', ''),
  nullif(u.raw_user_meta_data->>'picture', '')
)
from auth.users u
where p.id = u.id
  and (p.avatar_url is null or trim(p.avatar_url) = '')
  and (u.raw_user_meta_data->>'avatar_url' is not null or u.raw_user_meta_data->>'picture' is not null);

-- 2. Update handle_new_user trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_avatar text;
  v_name text;
begin
  v_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  );
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  );

  insert into public.profiles (id, email, full_name, phone, role, avatar_url)
  values (
    new.id,
    new.email,
    v_name,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case
      when new.raw_user_meta_data->>'role' in ('customer', 'collector', 'recycling_organisation', 'admin')
        then (new.raw_user_meta_data->>'role')::public.user_role
      else 'customer'::public.user_role
    end,
    nullif(v_avatar, '')
  )
  on conflict (id) do update
  set avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), nullif(excluded.avatar_url, '')),
      full_name = case
        when trim(public.profiles.full_name) = '' then coalesce(excluded.full_name, public.profiles.full_name)
        else public.profiles.full_name
      end,
      updated_at = now();

  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 3. Update ensure_my_profile function
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
  v_meta_avatar text;
  v_meta_name text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select email,
         coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', ''),
         coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')
  into v_email, v_meta_avatar, v_meta_name
  from auth.users where id = v_user_id;

  insert into public.profiles (id, email, full_name, phone, role, avatar_url)
  values (
    v_user_id,
    coalesce(v_email, ''),
    coalesce(nullif(trim(p_full_name), ''), nullif(trim(v_meta_name), ''), ''),
    p_phone,
    coalesce(
      p_role,
      case
        when (select raw_user_meta_data->>'role' from auth.users where id = v_user_id)
          in ('customer', 'collector', 'recycling_organisation', 'admin')
          then ((select raw_user_meta_data->>'role' from auth.users where id = v_user_id))::public.user_role
        else 'customer'::public.user_role
      end
    ),
    nullif(v_meta_avatar, '')
  )
  on conflict (id) do update
  set full_name = case
        when trim(excluded.full_name) <> '' then excluded.full_name
        else public.profiles.full_name
      end,
      phone = coalesce(excluded.phone, public.profiles.phone),
      avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), nullif(excluded.avatar_url, '')),
      updated_at = now()
  returning * into v_profile;

  insert into public.wallets (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  return v_profile;
end;
$$;
