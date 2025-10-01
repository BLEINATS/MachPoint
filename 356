/*
  # [Fix] Correct column names in reservation creation function
  [This migration corrects a typo in the `create_client_reservation_atomic` function, changing `clientname` to `client_name` and `clientphone` to `client_phone` to match the database schema. This resolves an error that prevented client reservations from being created.]

  ## Query Description: [This operation drops and recreates a database function. It is a safe, non-destructive change that only affects the logic for creating new reservations. No existing data will be altered or lost.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [false]
  
  ## Structure Details:
  - Functions affected: `public.create_client_reservation_atomic`
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [authenticated]
  
  ## Performance Impact:
  - Indexes: [No]
  - Triggers: [No]
  - Estimated Impact: [None. This is a function definition change.]
*/

-- Drop the existing function to avoid conflicts
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, text, text, numeric, jsonb, text, text);

-- Recreate the function with the correct column names
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic (
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
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_id uuid;
  v_profile_id uuid;
  v_reserva_id uuid;
BEGIN
  -- Ensure the user has an 'aluno' profile in the arena, creating one if it doesn't exist.
  SELECT id INTO v_aluno_id FROM public.ensure_aluno_profile_exists(
    p_arena_id,
    auth.uid(),
    p_client_name,
    p_client_phone
  );

  -- Get the profile_id from the aluno record
  SELECT profile_id INTO v_profile_id FROM public.alunos WHERE id = v_aluno_id;

  -- Insert the reservation with the correct column names
  INSERT INTO public.reservas (
    arena_id,
    quadra_id,
    profile_id,
    date,
    start_time,
    end_time,
    total_price,
    payment_status,
    sport_type,
    credit_used,
    rented_items,
    client_name, -- Corrected from clientname
    client_phone, -- Corrected from clientphone
    type,
    status
  )
  VALUES (
    p_arena_id,
    p_quadra_id,
    v_profile_id,
    p_date,
    p_start_time,
    p_end_time,
    p_total_price,
    p_payment_status::public.payment_status,
    p_sport_type,
    p_credit_to_use,
    p_rented_items,
    p_client_name,
    p_client_phone,
    'avulsa',
    'confirmada'
  )
  RETURNING id INTO v_reserva_id;

  -- If credit was used, deduct it and record the transaction
  IF p_credit_to_use > 0 THEN
    -- Deduct credit from the aluno's balance
    UPDATE public.alunos
    SET credit_balance = credit_balance - p_credit_to_use
    WHERE id = v_aluno_id;

    -- Log the credit transaction
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || v_reserva_id::text, v_reserva_id);
  END IF;

  RETURN v_reserva_id;
END;
$$;

-- Grant execute permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, text, text, numeric, jsonb, text, text) TO authenticated;
