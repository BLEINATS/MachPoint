/*
  # [Operation Name]
  [This operation provides a definitive fix for the 'function is not unique' error by removing all conflicting versions of the reservation functions and recreating them with the correct, unambiguous signatures.]
  ## Query Description: [This script resolves a persistent and complex error by dropping multiple conflicting database functions and recreating them with the correct structure. This is a critical fix to restore the client reservation functionality. The operation is designed to be safe and will not affect existing data, mas it modifies core application logic.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: false (The old, incorrect functions will be dropped permanently)
  ## Structure Details:
  - Functions 'ensure_aluno_profile', 'check_duplicate_reservation', and 'create_client_reservation_atomic' will be dropped and recreated.
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: Admin privileges
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible.
*/
-- Step 1: Drop all known conflicting function signatures to ensure a clean slate.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,time,time,numeric,public.payment_status_enum,text,numeric,jsonb,text,text);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,character varying,character varying,numeric,public.payment_status_enum,character varying,numeric,jsonb,character varying,character varying);
DROP FUNCTION IF EXISTS public.check_duplicate_reservation(uuid, uuid, date, time, time);
DROP FUNCTION IF EXISTS public.check_duplicate_reservation(uuid, date, time without time zone, time without time zone, uuid);
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid);
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid, uuid, text, text);

-- Step 2: Recreate 'ensure_aluno_profile' to handle new client creation correctly.
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile(
    p_profile_id uuid,
    p_arena_id uuid,
    p_name text,
    p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_id uuid;
BEGIN
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = p_profile_id AND arena_id = p_arena_id
    LIMIT 1;

    IF v_aluno_id IS NOT NULL THEN
        RETURN v_aluno_id;
    END IF;

    INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, join_date, plan_name)
    VALUES (p_profile_id, p_arena_id, p_name, p_phone, 'ativo', CURRENT_DATE, 'Avulso')
    RETURNING id INTO v_aluno_id;

    RETURN v_aluno_id;
END;
$$;

-- Step 3: Recreate 'check_duplicate_reservation' with the correct, unique signature.
CREATE OR REPLACE FUNCTION public.check_duplicate_reservation(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_end_time time;
BEGIN
    v_end_time := p_end_time;
    IF p_end_time <= p_start_time THEN
        v_end_time := '23:59:59';
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.reservas
        WHERE
            arena_id = p_arena_id AND
            quadra_id = p_quadra_id AND
            date = p_date AND
            status <> 'cancelada' AND
            (start_time < v_end_time AND end_time > p_start_time)
    );
END;
$$;

-- Step 4: Recreate the main function 'create_client_reservation_atomic' ensuring it calls helpers correctly.
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
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
    v_reserva_id uuid;
    v_gamification_enabled boolean;
BEGIN
    v_aluno_id := ensure_aluno_profile(v_profile_id, p_arena_id, p_client_name, p_client_phone);

    IF check_duplicate_reservation(p_arena_id, p_quadra_id, p_date, p_start_time, p_end_time) THEN
        RAISE EXCEPTION 'Horário indisponível. Já existe uma reserva neste período.';
    END IF;

    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, client_name, client_phone, date, start_time, end_time,
        total_price, payment_status, sport_type, credit_used, rented_items, type, status,
        created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_client_name, p_client_phone, p_date, p_start_time, p_end_time,
        p_total_price, p_payment_status, p_sport_type, p_credit_to_use, p_rented_items, 'avulsa', 'confirmada',
        p_client_name
    )
    RETURNING id INTO v_reserva_id;

    IF p_credit_to_use > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;

        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_reserva_id::text, 1, 8), v_reserva_id);
    END IF;

    SELECT is_enabled INTO v_gamification_enabled FROM public.gamification_settings WHERE arena_id = p_arena_id;
    IF v_gamification_enabled THEN
        PERFORM add_gamification_points(v_aluno_id, 1, 'Reserva criada', 'reservation_completed', v_reserva_id, p_arena_id);
    END IF;

    RETURN v_reserva_id;
END;
$$;
