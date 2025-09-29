/*
  # [Operation Name]
  [This operation fixes a critical bug in the 'create_client_reservation_atomic' function that prevented new reservations from being created due to a function signature mismatch.]
  ## Query Description: [This script safely drops and recreates the 'create_client_reservation_atomic' function. The fix corrects an internal call to the 'check_duplicate_reservation' function by explicitly casting a NULL parameter to the correct type (uuid), resolving the 'function does not exist' error. This change is critical for restoring the client reservation functionality and has no impact on existing data.]
  ## Metadata:
  - Schema-Category: 'Structural'
  - Impact-Level: 'High'
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function 'create_client_reservation_atomic' will be dropped and recreated.
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: Admin privileges
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. This is a logic fix within a function.
*/
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,time,time,numeric,public.payment_status_enum,text,numeric,jsonb,text,text);
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
    v_gamification_is_enabled boolean;
    v_points_per_reservation integer;
BEGIN
    -- Ensure an 'aluno' profile exists for this user and arena
    v_aluno_id := public.ensure_aluno_profile(v_profile_id, p_arena_id, p_client_name, p_client_phone);

    -- Check for duplicate reservation
    IF public.check_duplicate_reservation(p_quadra_id, p_date, p_start_time, p_end_time, NULL::uuid) THEN
        RAISE EXCEPTION 'Horário já reservado.';
    END IF;

    -- Insert the new reservation
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time,
        total_price, payment_status, sport_type, credit_used, rented_items,
        client_name, client_phone, type, status, created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time,
        p_total_price, p_payment_status, p_sport_type, p_credit_to_use, p_rented_items,
        p_client_name, p_client_phone, 'avulsa', 'confirmada', p_client_name
    )
    RETURNING id INTO v_reserva_id;

    -- Handle credit usage if any
    IF p_credit_to_use > 0 THEN
        -- Deduct credit from aluno's balance
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;

        -- Log the credit transaction
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_reserva_id::text, 1, 8), v_reserva_id);
    END IF;

    -- Check if gamification is enabled for the arena
    SELECT is_enabled, points_per_reservation INTO v_gamification_is_enabled, v_points_per_reservation
    FROM public.gamification_settings
    WHERE arena_id = p_arena_id;

    -- If enabled, add points for making a reservation
    IF v_gamification_is_enabled AND v_points_per_reservation > 0 THEN
        PERFORM public.add_gamification_points(
            v_aluno_id,
            v_points_per_reservation,
            'Pontos por nova reserva',
            'reservation_completed',
            p_arena_id,
            v_reserva_id
        );
    END IF;

    RETURN v_reserva_id;
END;
$$;
