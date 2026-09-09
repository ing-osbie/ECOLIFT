-- Supabase (PostgreSQL) Migration
-- Run in the Supabase SQL Editor if the orders table already exists.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS disposal_lat double precision,
  ADD COLUMN IF NOT EXISTS disposal_lng double precision,
  ADD COLUMN IF NOT EXISTS disposal_address text;