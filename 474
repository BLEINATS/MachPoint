/*
# [Fix] Correct Reservation Function and Resolve Conflicts
[This migration resolves an error during reservation creation by correcting column names and removing conflicting database functions.]

## Query Description: [This operation will drop potentially conflicting versions of the `create_client_reservation_atomic` function and recreate the correct one. It fixes a bug preventing new reservations from being created. There is no risk to existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops two potentially conflicting versions of `create_client_reservation_atomic`.
- Recreates `create_client_reservation_atomic` using `client_name` and `client_phone` columns.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No Change]
- Triggers: [No Change]
- Estimated Impact: [None]
*/

-- Drop conflicting function signatures to resolve ambiguity
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, character varying, character varying, numeric, public.payment_status_enum, character varying, numeric, jsonb, character varying, character varying);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, public.payment_status_enum, text, numeric, jsonb, text, text);

-- Recreate the function with the correct signature and column names
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_total_price numeric,
    p_payment_status public.payment_status_enum,
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
    v_aluno_id uuid;
    v_profile_id uuid;
    v_new_reserva_id uuid;
    v_gamification_is_enabled boolean;
BEGIN
    -- Ensure the client exists as an aluno profile in the arena
    v_profile_id := auth.uid();
    v_aluno_id := public.ensure_aluno_profile(v_profile_id, p_arena_id);

    -- Check for overlapping reservations
    IF EXISTS (
        SELECT 1
        FROM public.reservas r
        WHERE r.quadra_id = p_quadra_id
          AND r.date = p_date
          AND r.status <> 'cancelada'
          AND (r.start_time, r.end_time) OVERLAPS (p_start_time, p_end_time)
    ) THEN
        RAISE EXCEPTION 'Conflito de horário: Já existe uma reserva para esta quadra neste horário.';
    END IF;

    -- Insert the new reservation with corrected column names
    INSERT INTO public.reservas (
        arena_id,
        quadra_id,
        profile_id,
        aluno_id,
        date,
        start_time,
        end_time,
        status,
        type,
        total_price,
        credit_used,
        payment_status,
        sport_type,
        rented_items,
        client_name,
        client_phone,
        created_by_name
    )
    VALUES (
        p_arena_id,
        p_quadra_id,
        v_profile_id,
        v_aluno_id,
        p_date,
        p_start_time,
        p_end_time,
        'confirmada',
        'avulsa',
        p_total_price,
        p_credit_to_use,
        p_payment_status,
        p_sport_type,
        p_rented_items,
        p_client_name,
        p_client_phone,
        p_client_name
    )
    RETURNING id INTO v_new_reserva_id;

    -- Deduct credit if used
    IF p_credit_to_use > 0 THEN
        PERFORM public.add_credit_to_aluno(v_aluno_id, p_arena_id, -p_credit_to_use);
        
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_new_reserva_id::text, 1, 8), v_new_reserva_id);
    END IF;

    -- Add gamification points if enabled
    SELECT is_enabled INTO v_gamification_is_enabled FROM public.gamification_settings WHERE arena_id = p_arena_id;
    
    IF v_gamification_is_enabled THEN
        PERFORM public.add_gamification_points_for_reservation(v_aluno_id, p_arena_id, v_new_reserva_id, p_total_price);
    END IF;
END;
$$;
