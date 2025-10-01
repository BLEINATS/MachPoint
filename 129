-- This script updates the reservation functions to correctly use the 'created_by_name' column,
-- which was added in a previous, partially failed migration.
-- It does NOT attempt to add the column again.

-- 1. Drop potentially outdated versions of the functions to avoid signature conflicts.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,time without time zone,time without time zone,numeric,text,text,numeric,jsonb,text,text);
DROP FUNCTION IF EXISTS public.create_admin_reservation(uuid,uuid,date,time without time zone,time without time zone,text,text,text,text,numeric,jsonb);


-- 2. Recreate the client reservation function to include 'created_by_name'.
/*
# [Function] create_client_reservation_atomic
Cria uma reserva de cliente de forma atômica, garantindo que o perfil de aluno exista e que a reserva seja inserida com todos os dados corretos, incluindo o nome de quem criou.
*/
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
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
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
    v_creator_name text;
BEGIN
    -- Get the creator's name
    SELECT name INTO v_creator_name FROM public.profiles WHERE id = v_profile_id;

    PERFORM public.ensure_aluno_profile_exists(v_profile_id, p_arena_id, p_client_name, p_client_phone);
    
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = v_profile_id AND arena_id = p_arena_id
    LIMIT 1;

    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time, status, type, total_price, payment_status, sport_type, credit_used, rented_items, "clientName", "clientPhone", created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, 'confirmada', 'avulsa', p_total_price, p_payment_status::payment_status, p_sport_type, p_credit_to_use, p_rented_items, p_client_name, p_client_phone, v_creator_name
    );

    IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;
    END IF;
END;
$$;

-- 3. Recreate the admin reservation function to include 'created_by_name'.
/*
# [Function] create_admin_reservation
Cria uma reserva pelo painel de admin, registrando o nome do administrador que a criou.
*/
CREATE OR REPLACE FUNCTION public.create_admin_reservation(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_client_name text,
    p_client_phone text,
    p_type text,
    p_status text,
    p_total_price numeric,
    p_rented_items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id uuid := auth.uid();
    v_admin_name text;
BEGIN
    -- Get admin's name from profiles table
    SELECT name INTO v_admin_name FROM public.profiles WHERE id = v_admin_id;

    INSERT INTO public.reservas (
        arena_id, quadra_id, date, start_time, end_time, "clientName", "clientPhone", type, status, total_price, rented_items, created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, p_date, p_start_time, p_end_time, p_client_name, p_client_phone, p_type::reservation_type, p_status::reservation_status, p_total_price, p_rented_items, v_admin_name
    );
END;
$$;

-- Grant permissions for the updated functions
GRANT EXECUTE ON FUNCTION public.create_client_reservation_atomic(uuid,uuid,date,time,time,numeric,text,text,numeric,jsonb,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_reservation(uuid,uuid,date,time,time,text,text,text,text,numeric,jsonb) TO authenticated;
