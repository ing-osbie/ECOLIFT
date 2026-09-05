-- ============================================================================
-- ECOLIFT ADMIN PLATFORM DATABASE EXTENSIONS & MIGRATIONS
-- ============================================================================

-- 1. Create Admin Role Enum
DO $$ BEGIN
    CREATE TYPE public.admin_role AS ENUM (
        'super_admin',
        'admin',
        'operations',
        'finance',
        'support',
        'dispatcher'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.admin_role NOT NULL DEFAULT 'admin',
    department TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for admin users
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);

-- 3. Create Immutable Audit Log Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- 4. Create Admin System Broadcasts / Notifications Table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_group TEXT NOT NULL DEFAULT 'all', -- 'all', 'customers', 'collectors', 'specific'
    target_user_ids UUID[] DEFAULT '{}',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Helper Function: Get Current Admin Role
CREATE OR REPLACE FUNCTION public.get_admin_role(p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role::text INTO v_role FROM public.admin_users WHERE id = p_user_id AND is_active = true;
    IF v_role IS NULL THEN
        -- Check profiles table fallback
        SELECT role::text INTO v_role FROM public.profiles WHERE id = p_user_id;
        IF v_role = 'admin' THEN
            v_role := 'super_admin';
        END IF;
    END IF;
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Helper Function: Check if caller is authorized admin
CREATE OR REPLACE FUNCTION public.is_authorized_admin(p_allowed_roles TEXT[] DEFAULT ARRAY['super_admin', 'admin', 'operations', 'finance', 'support', 'dispatcher'])
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := public.get_admin_role(auth.uid());
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN v_role = ANY(p_allowed_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Audit Logger RPC
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action TEXT,
    p_target_entity TEXT,
    p_target_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_admin_id UUID;
    v_admin_role TEXT;
    v_log_id UUID;
BEGIN
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_admin_role := public.get_admin_role(v_admin_id);
    IF v_admin_role IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User is not an admin';
    END IF;

    INSERT INTO public.admin_audit_logs (
        admin_id,
        admin_role,
        action,
        target_entity,
        target_id,
        metadata
    ) VALUES (
        v_admin_id,
        v_admin_role,
        p_action,
        p_target_entity,
        p_target_id,
        p_metadata
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Atomic Admin Wallet Adjustment Function
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reason TEXT,
    p_order_id UUID DEFAULT NULL
)
RETURNS public.wallets AS $$
DECLARE
    v_wallet public.wallets;
    v_prev_balance NUMERIC;
    v_new_balance NUMERIC;
    v_admin_id UUID;
    v_admin_role TEXT;
    v_tx_type public.transaction_type;
BEGIN
    v_admin_id := auth.uid();
    v_admin_role := public.get_admin_role(v_admin_id);

    IF v_admin_role NOT IN ('super_admin', 'admin', 'finance') THEN
        RAISE EXCEPTION 'Unauthorized: Only Finance or Super Admin can adjust wallets';
    END IF;

    IF p_amount = 0 THEN
        RAISE EXCEPTION 'Adjustment amount cannot be 0';
    END IF;

    -- Lock target wallet row
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
    END IF;

    v_prev_balance := v_wallet.balance;

    IF p_amount > 0 THEN
        v_tx_type := 'credit';
        v_new_balance := v_prev_balance + p_amount;
    ELSE
        v_tx_type := 'debit';
        v_new_balance := v_prev_balance + p_amount; -- p_amount is negative
        IF v_new_balance < 0 THEN
            RAISE EXCEPTION 'Insufficient funds for debit adjustment';
        END IF;
    END IF;

    -- Update balance
    UPDATE public.wallets
    SET balance = v_new_balance, updated_at = now()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    -- Insert wallet transaction record
    INSERT INTO public.wallet_transactions (
        wallet_id,
        user_id,
        amount,
        type,
        status,
        description,
        reference
    ) VALUES (
        v_wallet.id,
        p_user_id,
        ABS(p_amount),
        v_tx_type,
        'successful',
        p_reason,
        'ADMIN_ADJUSTMENT_' || v_wallet.id
    );

    -- Log to audit trail
    PERFORM public.log_admin_action(
        'WALLET_ADJUSTMENT',
        'wallets',
        v_wallet.id::text,
        jsonb_build_object(
            'target_user_id', p_user_id,
            'amount', p_amount,
            'prev_balance', v_prev_balance,
            'new_balance', v_new_balance,
            'reason', p_reason,
            'order_id', p_order_id
        )
    );

    RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Admin Reassign Order Function
CREATE OR REPLACE FUNCTION public.admin_assign_collector(
    p_order_id UUID,
    p_collector_id UUID
)
RETURNS public.orders AS $$
DECLARE
    v_order public.orders;
    v_collector public.collectors;
    v_admin_role TEXT;
BEGIN
    v_admin_role := public.get_admin_role(auth.uid());
    IF v_admin_role NOT IN ('super_admin', 'admin', 'operations', 'dispatcher') THEN
        RAISE EXCEPTION 'Unauthorized: Only Operations or Dispatcher can assign collectors';
    END IF;

    -- Lock order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Lock collector
    SELECT * INTO v_collector FROM public.collectors WHERE id = p_collector_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Collector not found';
    END IF;

    -- Update order
    UPDATE public.orders
    SET collector_id = p_collector_id, status = 'confirmed', updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    -- Upsert collector job
    INSERT INTO public.collector_jobs (
        collector_id,
        order_id,
        customer_id,
        waste_type,
        pickup_address,
        fare,
        status
    ) VALUES (
        p_collector_id,
        p_order_id,
        v_order.customer_id,
        v_order.waste_type,
        v_order.pickup_address,
        v_order.price,
        'accepted'
    ) ON CONFLICT (id) DO UPDATE SET collector_id = p_collector_id, status = 'accepted';

    -- Audit log
    PERFORM public.log_admin_action(
        'ASSIGN_COLLECTOR',
        'orders',
        p_order_id::text,
        jsonb_build_object('collector_id', p_collector_id)
    );

    RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Admin Suspend/Reactivate User
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(
    p_target_user_id UUID,
    p_is_active BOOLEAN,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_role TEXT;
BEGIN
    v_admin_role := public.get_admin_role(auth.uid());
    IF v_admin_role NOT IN ('super_admin', 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Only Admin or Super Admin can suspend/reactivate users';
    END IF;

    -- Update profiles
    UPDATE public.profiles SET is_verified = p_is_active WHERE id = p_target_user_id;

    -- If collector, update verification
    UPDATE public.collectors SET is_verified = p_is_active, is_online = (CASE WHEN p_is_active THEN is_online ELSE false END) WHERE id = p_target_user_id;

    -- Audit log
    PERFORM public.log_admin_action(
        CASE WHEN p_is_active THEN 'REACTIVATE_USER' ELSE 'SUSPEND_USER' END,
        'profiles',
        p_target_user_id::text,
        jsonb_build_object('is_active', p_is_active, 'reason', p_reason)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Row Level Security Policies for Admin Tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin Users Policies
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT TO authenticated USING (public.is_authorized_admin());

CREATE POLICY "Super admins can manage admin users" ON public.admin_users
    FOR ALL TO authenticated USING (public.get_admin_role() = 'super_admin');

-- Audit Logs Policies (Immutable, SELECT for admins only, INSERT via security definer RPC)
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT TO authenticated USING (public.is_authorized_admin());

-- Admin Notifications Policies
CREATE POLICY "Admins can view admin notifications" ON public.admin_notifications
    FOR SELECT TO authenticated USING (public.is_authorized_admin());

CREATE POLICY "Admins can insert admin notifications" ON public.admin_notifications
    FOR INSERT TO authenticated WITH CHECK (public.is_authorized_admin());
