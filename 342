/*
          # [Function Update] Log Cancellation Credit
          Updates the `cancel_reservation_and_get_credit` function to insert a record into the `credit_transactions` table upon successful cancellation with credit.

          ## Query Description: [This operation modifies a database function to add logging capabilities. It ensures that when a user cancels a reservation and receives credit, a corresponding entry is made in their credit history, improving transparency and traceability. This change is safe and does not affect existing data integrity.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Modifies the function: `public.cancel_reservation_and_get_credit(uuid)`
          - Adds an `INSERT` statement into `public.credit_transactions`.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [The function continues to run with invoker security, ensuring user permissions are respected.]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Negligible. Adds a single indexed insert operation to the function's execution.]
          */

DROP FUNCTION IF EXISTS public.cancel_reservation_and_get_credit(uuid);

CREATE OR REPLACE FUNCTION public.cancel_reservation_and_get_credit(p_reserva_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_reserva public.reservas;
  v_arena_id uuid;
  v_profile_id uuid;
  v_aluno_id uuid;
  v_credit_amount numeric;
  v_policy_text text;
  v_hours_until numeric;
BEGIN
  -- 1. Get the reservation details
  SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

  IF v_reserva IS NULL THEN
    RAISE EXCEPTION 'Reserva não encontrada.';
  END IF;

  -- 2. Security Check: Ensure the user owns the reservation
  IF auth.uid() IS NULL OR auth.uid() != v_reserva.profile_id THEN
    RAISE EXCEPTION 'Permissão negada: Você não pode cancelar esta reserva.';
  END IF;

  v_arena_id := v_reserva.arena_id;
  v_profile_id := v_reserva.profile_id;

  -- 3. Find the associated 'aluno' profile for credit application
  SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = v_profile_id AND arena_id = v_arena_id LIMIT 1;

  IF v_aluno_id IS NULL THEN
    RAISE EXCEPTION 'Perfil de cliente não encontrado nesta arena para aplicar o crédito.';
  END IF;

  -- 4. Calculate credit based on cancellation policy
  v_hours_until := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - NOW())) / 3600;
  
  IF v_hours_until >= 24 THEN
    v_credit_amount := v_reserva.total_price;
    v_policy_text := 'Cancelamento com +24h';
  ELSIF v_hours_until >= 12 THEN
    v_credit_amount := v_reserva.total_price * 0.5;
    v_policy_text := 'Cancelamento entre 12-24h';
  ELSE
    v_credit_amount := 0;
    v_policy_text := 'Cancelamento com -12h';
  END IF;

  -- 5. Update the reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- 6. Apply credit and log the transaction
  IF v_credit_amount > 0 THEN
    -- Add credit to the aluno's balance
    UPDATE public.alunos
    SET credit_balance = credit_balance + v_credit_amount
    WHERE id = v_aluno_id;

    -- **NEW**: Insert a record into the credit transactions history
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (
      v_aluno_id,
      v_arena_id,
      v_credit_amount,
      'cancellation_credit',
      'Crédito (' || v_policy_text || ') da reserva #' || substr(p_reserva_id::text, 1, 8),
      p_reserva_id
    );
  END IF;

  RETURN true;
END;
$$;
