/*
# [Operation Name]
[Definitively resolves the client reservation function conflict by removing all old versions and recreating the correct one.]

## Query Description: [This script will first ensure the `payment_status_enum` type exists. It will then remove all potentially conflicting versions of the `create_client_reservation_atomic` function to eliminate any ambiguity. Finally, it will recreate the single, correct version of the function. This is a critical fix to allow client-side reservations to work correctly. It does not affect any existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Ensuring type: `public.payment_status_enum`
- Dropping function: `public.create_client_reservation_atomic` (multiple signatures)
- Creating function: `public.create_client_reservation_atomic` (definitive version)

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Admin privileges]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None. Fixes a blocking error.]
*/

-- Ensure the enum type exists before creating the function that uses it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE public.payment_status_enum AS ENUM ('pago', 'pendente', 'parcialmente_pago');
    END IF;
END$$;

-- Drop the version with the enum type, just in case it's malformed or outdated.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status public.payment_status_enum,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
);

-- Drop the old version that used 'text' for payment status. This is the likely source of conflict.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status text,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
);

-- Re-create the definitive, correct version of the function.
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status public.payment_status_enum,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_id uuid;
    v_profile_id uuid;
    v_reservation_id uuid;
    v_overlapping_reservations int;
    v_gamification_is_enabled boolean;
    v_points_to_add int;
    v_points_per_real int;
BEGIN
    -- 1. Check for overlapping reservations
    SELECT count(*)
    INTO v_overlapping_reservations
    FROM public.reservas
    WHERE quadra_id = p_quadra_id
      AND date = p_date
      AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
      AND status <> 'cancelada';

    IF v_overlapping_reservations > 0 THEN
        RAISE EXCEPTION 'Horário indisponível. Já existe uma reserva neste período.';
    END IF;

    -- 2. Find or create Aluno profile based on authenticated user
    SELECT id, profile_id INTO v_aluno_id, v_profile_id
    FROM public.alunos
    WHERE profile_id = auth.uid() AND arena_id = p_arena_id;

    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (arena_id, profile_id, name, phone, email, status, plan_name, join_date)
        VALUES (p_arena_id, auth.uid(), p_client_name, p_client_phone, (SELECT email FROM auth.users WHERE id = auth.uid()), 'ativo', 'Avulso', CURRENT_DATE)
        ON CONFLICT (profile_id, arena_id) DO UPDATE SET name = p_client_name
        RETURNING id, profile_id INTO v_aluno_id, v_profile_id;
    END IF;

    -- 3. Insert the new reservation, linking to the authenticated user's profile
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time, 
        total_price, payment_status, sport_type, clientName, clientPhone, 
        type, status, credit_used, rented_items, created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, auth.uid(), p_date, p_start_time, p_end_time,
        p_total_price, p_payment_status, p_sport_type, p_client_name, p_client_phone,
        'avulsa', 'confirmada', p_credit_to_use, p_rented_items, p_client_name
    )
    RETURNING id INTO v_reservation_id;

    -- 4. Update credit balance if credit was used
    IF p_credit_to_use > 0 THEN
        PERFORM add_credit_to_aluno(v_aluno_id, p_arena_id, -p_credit_to_use);
    END IF;
    
    -- 5. Award gamification points
    SELECT is_enabled, points_per_real INTO v_gamification_is_enabled, v_points_per_real
    FROM public.gamification_settings
    WHERE arena_id = p_arena_id;

    IF v_gamification_is_enabled AND p_total_price > 0 THEN
        v_points_to_add := floor(p_total_price * v_points_per_real);
        
        IF v_points_to_add > 0 THEN
            PERFORM add_gamification_points(v_aluno_id, v_points_to_add, 'Pontos por reserva paga');
        END IF;
    END IF;

    RETURN v_reservation_id;
END;
$$;
