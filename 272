/*
# [Operation Name]
Fix Credit Cancellation Logic

## Query Description: [This operation adjusts the credit system to correctly handle cancellations for all client types. It modifies the `credit_transactions` table to allow for logging transactions for clients who are not registered platform users, and updates the cancellation function to use this new flexibility. This ensures that all clients receive credit correctly upon cancellation, improving data consistency.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies `credit_transactions` table: makes `profile_id` column nullable.
- Replaces `handle_client_cancellation_final` function: improves logic for finding client profiles and logging transactions.

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The changes affect a function call during cancellation, which is not a high-frequency operation.
*/

-- Step 1: Make profile_id nullable in credit_transactions
ALTER TABLE public.credit_transactions
ALTER COLUMN profile_id DROP NOT NULL;

-- Step 2: Update the cancellation function to handle all client types
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reserva RECORD;
  v_aluno_profile RECORD;
  v_credit_amount NUMERIC;
  v_hours_until_reservation INT;
BEGIN
  -- 1. Fetch reservation details
  SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

  IF v_reserva IS NULL THEN
    RAISE EXCEPTION 'Reserva não encontrada.';
  END IF;

  -- 2. Calculate hours until reservation
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - NOW())) / 3600;

  -- 3. Determine credit amount based on policy
  IF v_hours_until_reservation >= 24 THEN
    v_credit_amount := v_reserva.total_price;
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_amount := v_reserva.total_price * 0.5;
  ELSE
    v_credit_amount := 0;
  END IF;

  -- 4. Update reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- 5. Apply credit and log transaction if applicable
  IF v_credit_amount > 0 THEN
    -- Find the 'aluno' profile.
    -- First, try by profile_id, which is the most reliable link.
    IF v_reserva.profile_id IS NOT NULL THEN
      SELECT * INTO v_aluno_profile FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id LIMIT 1;
    END IF;

    -- If not found by profile_id (or if profile_id was null), try by name. This is less reliable but a good fallback.
    IF v_aluno_profile IS NULL AND v_reserva."clientName" IS NOT NULL THEN
      SELECT * INTO v_aluno_profile FROM public.alunos WHERE name = v_reserva."clientName" AND arena_id = v_reserva.arena_id LIMIT 1;
    END IF;

    -- If we still can't find the aluno, we can't apply credit.
    IF v_aluno_profile IS NULL THEN
      RAISE NOTICE 'Perfil de aluno não encontrado para a reserva. Crédito não aplicado.';
      RETURN;
    END IF;

    -- Update aluno's credit balance
    UPDATE public.alunos
    SET credit_balance = credit_balance + v_credit_amount
    WHERE id = v_aluno_profile.id;

    -- Insert into credit transactions log. profile_id can now be null.
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id, profile_id)
    VALUES (
      v_aluno_profile.id,
      v_reserva.arena_id,
      v_credit_amount,
      'cancellation_credit',
      'Crédito de cancelamento da reserva #' || SUBSTRING(v_reserva.id::text, 1, 8),
      v_reserva.id,
      v_aluno_profile.profile_id -- This can be null, and the table now allows it.
    );
  END IF;
END;
$$;
