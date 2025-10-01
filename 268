/*
  # [Function] Final Client Cancellation Logic
  [This migration cleans up old, unused cancellation functions and creates a single, robust function to handle client-side reservation cancellations, including credit calculation and application.]

  ## Query Description: [This operation will drop several old database functions and create a new one. It is designed to be safe and consolidate logic, but as it touches core booking functionality, a backup is always a good practice.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Medium"]
  - Requires-Backup: [true]
  - Reversible: [false]
  
  ## Structure Details:
  - Dropping functions: cancel_my_booking, client_cancel_reservation_by_id, handle_client_cancellation, cancel_reservation_and_get_credit, etc.
  - Creating function: handle_client_cancellation_final
  
  ## Security Implications:
  - RLS Status: [N/A for function, but interacts with RLS-protected tables]
  - Policy Changes: [No]
  - Auth Requirements: [Runs with invoker's security context]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [Low. Consolidates logic into a single function call.]
*/

-- Drop all previous attempts to avoid conflicts and clean up the schema
DROP FUNCTION IF EXISTS public.cancel_my_booking(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v2(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_reservation_by_id_v3(uuid);
DROP FUNCTION IF EXISTS public.handle_client_cancellation(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_get_credit(uuid);
DROP FUNCTION IF EXISTS public.cancel_reservation_and_get_credit_v2(uuid);
DROP FUNCTION IF EXISTS public.cancel_booking_as_client(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_booking(uuid);
DROP FUNCTION IF EXISTS public.client_cancel_booking_final(uuid);


-- Create the new, definitive function
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_reserva RECORD;
  v_aluno RECORD;
  v_credit_amount NUMERIC := 0;
  v_hours_until_reservation INT;
  v_policy_reason TEXT;
BEGIN
  -- 1. Fetch the reservation and ensure the caller is the owner
  SELECT * INTO v_reserva
  FROM public.reservas
  WHERE id = p_reserva_id AND profile_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permissão negada ou reserva não encontrada.';
  END IF;

  -- 2. Calculate hours until reservation
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  -- 3. Calculate credit based on policy (hardcoded as per previous logic)
  IF v_hours_until_reservation >= 24 THEN
    v_credit_amount := v_reserva.total_price;
    v_policy_reason := 'Cancelamento com +24h';
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_amount := v_reserva.total_price * 0.5;
    v_policy_reason := 'Cancelamento entre 12h-24h';
  ELSE
    v_credit_amount := 0;
    v_policy_reason := 'Cancelamento com -12h';
  END IF;

  -- 4. Update the reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- 5. If credit is due, find the associated 'aluno' profile and apply it
  IF v_credit_amount > 0 THEN
    SELECT * INTO v_aluno
    FROM public.alunos
    WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;

    IF FOUND THEN
      -- Update aluno's credit balance
      UPDATE public.alunos
      SET credit_balance = credit_balance + v_credit_amount
      WHERE id = v_aluno.id;

      -- Insert a record into the credit transaction history
      INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
      VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', v_policy_reason || ' da reserva #' || substr(p_reserva_id::text, 1, 8), p_reserva_id);
    END IF;
  END IF;

END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_client_cancellation_final(uuid) TO authenticated;
