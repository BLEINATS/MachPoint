-- Drop conflicting/old functions first to ensure a clean slate.
-- The specific signatures are taken from past error messages.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,character varying,character varying,numeric,public.payment_status_enum,character varying,numeric,jsonb,character varying,character varying);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,"time", "time",numeric,public.payment_status_enum,text,numeric,jsonb,text,text);
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid,uuid,text,text);
DROP FUNCTION IF EXISTS public.ensure_aluno_profile(uuid,uuid);

-- Recreate ensure_aluno_profile with the correct signature and logic.
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
    -- Try to find an existing aluno record for this profile and arena
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

    -- If not found, create a new one
    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, join_date, plan_name)
        VALUES (p_profile_id, p_arena_id, p_name, p_phone, 'ativo', CURRENT_DATE, 'Avulso')
        RETURNING id INTO v_aluno_id;
    END IF;

    RETURN v_aluno_id;
END;
$$;

-- Recreate create_client_reservation_atomic with the correct calls and logic.
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
    v_reserva_id uuid;
    v_aluno_id uuid;
    v_gamification_is_enabled boolean;
    v_points_per_real integer;
    v_points_per_reservation integer;
    v_points_to_add integer;
BEGIN
    -- Ensure an aluno profile exists for the user in this arena
    v_aluno_id := ensure_aluno_profile(auth.uid(), p_arena_id, p_client_name, p_client_phone);

    -- Check for duplicate reservations
    IF check_duplicate_reservation(p_quadra_id, p_date, p_start_time, p_end_time, null) THEN
        RAISE EXCEPTION 'Horário já reservado.';
    END IF;

    -- Insert the reservation
    INSERT INTO public.reservas (
        arena_id,
        quadra_id,
        profile_id,
        aluno_id,
        date,
        start_time,
        end_time,
        total_price,
        payment_status,
        sport_type,
        credit_used,
        rented_items,
        clientName,
        clientPhone,
        created_by_name,
        type,
        status
    )
    VALUES (
        p_arena_id,
        p_quadra_id,
        auth.uid(),
        v_aluno_id,
        p_date,
        p_start_time,
        p_end_time,
        p_total_price,
        p_payment_status,
        p_sport_type,
        p_credit_to_use,
        p_rented_items,
        p_client_name,
        p_client_phone,
        p_client_name,
        'avulsa',
        'confirmada'
    )
    RETURNING id INTO v_reserva_id;

    -- Handle gamification points
    SELECT is_enabled, points_per_real, points_per_reservation
    INTO v_gamification_is_enabled, v_points_per_real, v_points_per_reservation
    FROM public.gamification_settings
    WHERE arena_id = p_arena_id;

    IF v_gamification_is_enabled THEN
        v_points_to_add := v_points_per_reservation + floor(p_total_price * v_points_per_real);
        
        IF v_points_to_add > 0 THEN
            PERFORM add_gamification_points(
                v_aluno_id,
                v_points_to_add,
                'Pontos por nova reserva',
                'reservation_completed',
                v_reserva_id,
                p_arena_id
            );
        END IF;
    END IF;

    RETURN v_reserva_id;
END;
$$;
