/*
# [FIX] Correct column name in reservation function
[This operation corrects a critical error in the client reservation function by replacing the non-existent `aluno_id` column with the correct `profile_id` column, which links the reservation to the user's profile.]

## Query Description: [This operation will replace the existing function used by clients to create reservations. It fixes a bug that was preventing new reservations from being created. There is no risk to existing data, but it is a critical fix for the booking functionality.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Function `create_client_reservation_atomic` is being replaced.
- The function will now correctly reference the `profile_id` column in the `reservas` table.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Function is `security invoker`, relying on RLS policies.]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Low. Function replacement is a quick metadata operation.]
*/

-- Drop the old, incorrect function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, character varying, character varying, numeric, public.payment_status_enum, character varying, numeric, jsonb, character varying, character varying);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, public.payment_status_enum, text, numeric, jsonb, text, text);

-- Recreate the function with the correct column name `profile_id`
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic (
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
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  v_aluno_id uuid;
  v_new_reserva_id uuid;
  v_gamification_is_enabled boolean;
BEGIN
  -- Ensure an 'aluno' profile exists for the user in this arena
  SELECT public.ensure_aluno_profile(v_profile_id, p_arena_id) INTO v_aluno_id;

  -- Check for duplicate reservations
  IF public.check_duplicate_reservation(p_quadra_id, p_date, p_start_time, p_end_time) THEN
    RAISE EXCEPTION 'Horário já reservado.';
  END IF;

  -- Insert the new reservation
  INSERT INTO public.reservas (
    arena_id,
    quadra_id,
    profile_id, -- Corrected column name
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
    type,
    status,
    created_by_name
  )
  VALUES (
    p_arena_id,
    p_quadra_id,
    v_profile_id, -- Use the user's profile ID
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
    'avulsa',
    'confirmada',
    p_client_name
  )
  RETURNING id INTO v_new_reserva_id;

  -- Handle credit usage
  IF p_credit_to_use > 0 THEN
    PERFORM public.add_credit_to_aluno(v_aluno_id, p_arena_id, -p_credit_to_use);
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_new_reserva_id::text, 1, 8), v_new_reserva_id);
  END IF;

  -- Handle gamification points
  SELECT is_enabled INTO v_gamification_is_enabled
  FROM public.gamification_settings
  WHERE arena_id = p_arena_id;

  IF v_gamification_is_enabled THEN
    PERFORM public.add_gamification_points(v_aluno_id, p_arena_id, 'reservation_completed', v_new_reserva_id);
  END IF;

END;
$$;
