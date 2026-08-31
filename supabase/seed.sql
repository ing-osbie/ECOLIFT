-- ============================================================================
-- EcoLift Seed Data (PostgreSQL / Supabase)
-- Run AFTER schema.sql in the Supabase SQL Editor.
-- ============================================================================

INSERT INTO public.vehicle_types (name, description, capacity_kg, base_price, is_active)
VALUES
  ('Ecolift Tricycle',     'Small tricycle for lightweight household pickups', 150,  25.00, true),
  ('Ecolift Standard Truck', 'Standard truck for medium loads',               500,  45.00, true),
  ('Ecolift Heavy Hauler', 'Large hauler for bulk and construction waste',    2000, 85.00, true)
ON CONFLICT DO NOTHING;

-- Sample collectors (requires matching auth.users entries).
-- Replace the UUIDs with real profile ids before running.
--
-- INSERT INTO public.collectors (id, vehicle_type_id, vehicle_name, plate_number, rating, total_jobs, is_online, is_verified)
-- VALUES
--   ('REPLACE_WITH_USER_UUID_1', (SELECT id FROM public.vehicle_types WHERE name = 'Ecolift Standard Truck'), 'Ecolift Truck #4',     'GT-4821-20', 4.9, 320, true, true),
--   ('REPLACE_WITH_USER_UUID_2', (SELECT id FROM public.vehicle_types WHERE name = 'Ecolift Tricycle'),       'Ecolift Tricycle #12', 'GT-1120-21', 4.7, 210, true, true)
-- ON CONFLICT DO NOTHING;

-- Sample support tickets (requires matching auth.users).
-- Replace the UUIDs below with real profile ids before running.
--
-- INSERT INTO public.support_tickets (user_id, subject, message, status)
-- VALUES
--   ('REPLACE_WITH_USER_UUID_1', 'Payment issue', 'My wallet top-up did not reflect after payment.', 'open'),
--   ('REPLACE_WITH_USER_UUID_2', 'Vehicle registration update', 'I need to update my vehicle plate number.', 'in_progress')
-- ON CONFLICT DO NOTHING;
