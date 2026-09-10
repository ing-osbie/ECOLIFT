-- Run this migration and let it commit before dispatch_tracking_migration.sql.
-- PostgreSQL does not allow a newly-added enum value to be used by the same
-- transaction's functions/constraints.
alter type public.order_status add value if not exists 'arrived';
alter type public.order_status add value if not exists 'pickup_in_progress';
alter type public.job_status add value if not exists 'offered';
alter type public.job_status add value if not exists 'arrived';
alter type public.job_status add value if not exists 'pickup_in_progress';
