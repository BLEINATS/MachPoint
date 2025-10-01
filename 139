/*
          # [Operation Name]
          Definitive Fix for Client Reservation Function

          ## Query Description: "This operation will definitively resolve the error that occurs when clients create a reservation. It does this by removing all old and conflicting versions of the reservation function and recreating the single, correct version. This is a safe structural change and will not affect any existing reservation data."
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops multiple conflicting versions of the `create_client_reservation_atomic` function.
          - Creates the final, correct version of the `create_client_reservation_atomic` function.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [Not Applicable]
          - Triggers: [Not Applicable]
          - Estimated Impact: [Low]
          */

-- Drop the version with the old TEXT type for payment status, if it exists.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, text, text, numeric, jsonb, text, text);

-- Drop the version with the correct ENUM type, just in case, to ensure a clean slate.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, payment_status_enum, text, numeric, jsonb, text, text);

-- Recreate the function with the correct signature and logic.
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_total_price numeric,
    p_payment_status payment_status_enum,
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
    v_new_reserva_id uuid;
    v_gamification_enabled boolean;
    v_points_to_add integer;
BEGIN
    -- Ensure an 'aluno' profile exists for the user in this arena
    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = v_profile_id AND arena_id = p_arena_id;

    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (arena_id, profile_id, name, phone, email, status, join_date, plan_name)
        VALUES (p_arena_id, v_profile_id, p_client_name, p_client_phone, (SELECT email FROM auth.users WHERE id = v_profile_id), 'ativo', CURRENT_DATE, 'Avulso')
        RETURNING id INTO v_aluno_id;
    END IF;

    -- Check for conflicting reservations
    IF EXISTS (
        SELECT 1
        FROM public.reservas
        WHERE quadra_id = p_quadra_id
          AND date = p_date
          AND status <> 'cancelada'
          AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    ) THEN
        RAISE EXCEPTION 'Conflito de horário. Já existe uma reserva para este horário.';
    END IF;

    -- Insert the new reservation
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time, total_price, 
        payment_status, sport_type, credit_used, rented_items, clientName, clientPhone, 
        type, status, created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, p_total_price,
        p_payment_status, p_sport_type, p_credit_to_use, p_rented_items, p_client_name, p_client_phone,
        'avulsa', 'confirmada', p_client_name
    )
    RETURNING id INTO v_new_reserva_id;

    -- Handle credit deduction if used
    IF p_credit_to_use > 0 THEN
        PERFORM public.add_credit_to_aluno(v_aluno_id, p_arena_id, -p_credit_to_use);
        
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_new_reserva_id::text, 1, 8), v_new_reserva_id);
    END IF;

    -- Handle gamification points
    SELECT is_enabled INTO v_gamification_enabled FROM public.gamification_settings WHERE arena_id = p_arena_id;
    
    IF v_gamification_enabled THEN
        -- Calculate points based on price
        SELECT floor(p_total_price * gs.points_per_real) + gs.points_per_reservation
        INTO v_points_to_add
        FROM public.gamification_settings gs
        WHERE gs.arena_id = p_arena_id;

        IF v_points_to_add > 0 THEN
             PERFORM public.add_gamification_points(
                v_aluno_id,
                v_points_to_add,
                'Reserva #' || substr(v_new_reserva_id::text, 1, 8)
            );
        END IF;
    END IF;
    
    -- Notify arena admin
    INSERT INTO public.notificacoes (arena_id, message, type, link_to)
    VALUES (p_arena_id, 'Nova reserva de ' || p_client_name || ' para ' || to_char(p_date, 'DD/MM') || ' às ' || to_char(p_start_time, 'HH24:MI'), 'nova_reserva', '/reservas');
END;
$$;
