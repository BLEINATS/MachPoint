/*
# Fix Client Cancellation Flow
[This migration adds the necessary RLS policy for credit transactions and creates a new, robust function for clients to cancel their own reservations, ensuring the entire process is atomic and secure.]

## Query Description: [This operation creates a new RLS policy and a database function. It is designed to be safe and non-destructive, only adding new capabilities and permissions. It will not affect existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Policy: "Allow clients to log their own credit transactions" on public.credit_transactions
- Function: public.cancel_my_reservation_final(p_reserva_id UUID)

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [User must be authenticated]

## Performance Impact:
- Indexes: [No]
- Triggers: [No]
- Estimated Impact: [Negligible performance impact.]
*/

-- Step 1: Add the missing INSERT policy for credit_transactions.
-- This allows users to create their own credit transaction records, which is necessary for logging cancellation credits.
DROP POLICY IF EXISTS "Allow clients to log their own credit transactions" ON public.credit_transactions;
CREATE POLICY "Allow clients to log their own credit transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Step 2: Create a new, clean, and final cancellation function.
-- This function uses SECURITY INVOKER to rely on RLS policies and explicitly selects columns to avoid unexpected errors.
CREATE OR REPLACE FUNCTION public.cancel_my_reservation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER -- Rely on RLS policies for security checks
AS $$
DECLARE
  v_reserva record;
  v_aluno record;
  v_credit_amount numeric := 0;
  v_hours_until_reservation integer;
BEGIN
  -- 1. Fetch the reservation. The RLS policy on 'reservas' ensures only the owner can select it.
  SELECT r.id, r.profile_id, r.arena_id, r.date, r.start_time, r.total_price INTO v_reserva
  FROM public.reservas AS r
  WHERE r.id = p_reserva_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva não encontrada ou você não tem permissão para acessá-la.';
  END IF;

  -- 2. Calculate credit based on a standard 24h/12h policy.
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  IF v_hours_until_reservation >= 24 THEN
    v_credit_amount := v_reserva.total_price;
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_amount := v_reserva.total_price * 0.5;
  ELSE
    v_credit_amount := 0;
  END IF;

  -- 3. Update reservation status. The RLS policy on 'reservas' allows this update.
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- 4. Apply credit if applicable.
  IF v_credit_amount > 0 THEN
    -- Find the corresponding 'aluno' profile. RLS policy allows this SELECT.
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;

    IF FOUND THEN
      -- Add credit to aluno's balance. RLS policy allows this UPDATE.
      UPDATE public.alunos
      SET credit_balance = credit_balance + v_credit_amount
      WHERE id = v_aluno.id;

      -- Log the transaction. The new RLS policy allows this INSERT.
      INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id, created_by, profile_id)
      VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', 'Crédito de cancelamento', p_reserva_id, auth.uid(), v_reserva.profile_id);
    END IF;
  END IF;
END;
$$;

-- Step 3: Grant execution permission for the new function to authenticated users.
GRANT EXECUTE ON FUNCTION public.cancel_my_reservation_final(uuid) TO authenticated;
