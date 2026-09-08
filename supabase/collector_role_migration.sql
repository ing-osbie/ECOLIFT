-- Run once in the Supabase SQL Editor for collector accounts created before
-- the signup role fix was deployed.
update public.profiles as p
set role = 'collector'::public.user_role,
    updated_at = now()
from auth.users as u
where p.id = u.id
  and p.role = 'customer'::public.user_role
  and u.raw_user_meta_data->>'role' = 'collector';