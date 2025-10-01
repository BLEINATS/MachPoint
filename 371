/*
          # [Function Conflict Resolution]
          [This operation definitively resolves a function signature conflict for `create_client_reservation_atomic` by dropping all potential conflicting versions and recreating a single, correct one. It also adds a crucial check to prevent double bookings.]

          ## Query Description: [This script first removes multiple outdated or conflicting versions of the reservation creation function. It then recreates the function with the correct signature and improved logic, including a check for time conflicts. This is a safe operation that standardizes a critical part of the system.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Functions affected: Drops and recreates `create_client_reservation_atomic`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [No]
          - Estimated Impact: [Low. Improves reliability by preventing failed inserts due to conflicts.]
          */

-- Drop potential conflicting function signatures
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, text, text, text, numeric, text, text, numeric, jsonb, text, text);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, text, text, text, numeric, public.payment_status_enum, text, numeric, jsonb, text, text);

-- Recreate the function with the correct signature and conflict check
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date text,
    p_start_time text,
    p_end_time text,
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
    v_gamification_is_enabled boolean;
    v_conflict_exists boolean;
BEGIN
    -- 0. Check for conflicts to prevent double booking
    SELECT EXISTS (
        SELECT 1
        FROM public.reservas
        WHERE
            quadra_id = p_quadra_id AND
            date = p_date AND
            status <> 'cancelada' AND
            (start_time, end_time) OVERLAPS (p_start_time::time, p_end_time::time)
    ) INTO v_conflict_exists;

    IF v_conflict_exists THEN
        RAISE EXCEPTION 'Conflito de horário. O horário solicitado já está reservado.';
    END IF;

    -- 1. Find or create 'aluno' record for the client
    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = v_profile_id AND arena_id = p_arena_id;

    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (arena_id, profile_id, name, phone, status, plan_name, join_date)
        VALUES (p_arena_id, v_profile_id, p_client_name, p_client_phone, 'ativo', 'Avulso', CURRENT_DATE)
        RETURNING id INTO v_aluno_id;
    END IF;

    -- 2. Insert the reservation
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, aluno_id, date, start_time, end_time, total_price, payment_status, 
        sport_type, credit_used, rented_items, clientName, clientPhone, type, status, created_by_name
    ) VALUES (
        p_arena_id, p_quadra_id, v_profile_id, v_aluno_id, p_date, p_start_time, p_end_time, p_total_price, p_payment_status,
        p_sport_type, p_credit_to_use, p_rented_items, p_client_name, p_client_phone, 'avulsa', 'confirmada', p_client_name
    ) RETURNING id INTO v_reserva_id;

    -- 3. Deduct credit if used
    IF p_credit_to_use > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;

        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || v_reserva_id::text, v_reserva_id);
    END IF;

    -- 4. Add gamification points if enabled
    SELECT is_enabled INTO v_gamification_is_enabled FROM public.gamification_settings WHERE arena_id = p_arena_id;
    
    IF v_gamification_is_enabled THEN
        PERFORM add_gamification_points(v_aluno_id, 10, 'Reserva criada'); -- Example points
    END IF;

    -- 5. Create notification for admin
    INSERT INTO public.notificacoes (arena_id, message, type, link_to)
    VALUES (p_arena_id, 'Nova reserva de ' || p_client_name || ' na quadra ' || (SELECT name FROM public.quadras WHERE id = p_quadra_id) || ' para ' || p_date, 'nova_reserva', '/reservas');

    RETURN v_reserva_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_client_reservation_atomic(uuid,uuid,text,text,text,numeric,public.payment_status_enum,text,numeric,jsonb,text,text) TO authenticated;
