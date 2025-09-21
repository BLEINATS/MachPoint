/*
# [Function] Create Client Cancellation Function
Creates a secure PostgreSQL function `cancel_my_reservation_and_get_credit` that allows a client to cancel their own reservation and automatically receive the correct credit amount based on the arena's cancellation policy.

## Query Description:
This operation creates a new database function. It is designed to be safe and will not impact existing data. The function encapsulates the logic for canceling a reservation and applying credit, ensuring the process is atomic and respects user permissions.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (the function can be dropped)

## Structure Details:
- Creates a new function: `public.cancel_my_reservation_and_get_credit(p_reserva_id uuid)`
- Grants `EXECUTE` permission to the `authenticated` role.

## Security Implications:
- RLS Status: The function uses `SECURITY INVOKER`, which means it runs with the permissions of the calling user, respecting existing RLS policies.
- Policy Changes: No
- Auth Requirements: The function internally checks that `auth.uid()` matches the `profile_id` of the reservation, ensuring users can only cancel their own bookings.

## Performance Impact:
- Indexes: Not applicable.
- Triggers: No
- Estimated Impact: Low. The function performs simple lookups and updates, which should be very fast.
*/

CREATE OR REPLACE FUNCTION public.cancel_my_reservation_and_get_credit(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_reserva record;
  v_aluno record;
  v_hours_until_reservation numeric;
  v_credit_amount numeric;
  v_credit_percentage numeric;
  v_cancellation_reason text;
BEGIN
  -- 1. Fetch the reservation and ensure the current user owns it.
  -- This also implicitly respects RLS policies because it's SECURITY INVOKER.
  SELECT * INTO v_reserva
  FROM public.reservas
  WHERE id = p_reserva_id AND profile_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permissão negada: Reserva não encontrada ou você não tem permissão para cancelá-la.';
  END IF;

  -- 2. Fetch the corresponding aluno profile.
  SELECT * INTO v_aluno
  FROM public.alunos
  WHERE profile_id = auth.uid() AND arena_id = v_reserva.arena_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de cliente não encontrado para esta arena.';
  END IF;

  -- 3. Calculate the time difference and determine credit.
  v_hours_until_reservation := EXTRACT(EPOCH FROM ((v_reserva.date + v_reserva.start_time) - now())) / 3600;

  IF v_hours_until_reservation >= 24 THEN
    v_credit_percentage := 100;
    v_cancellation_reason := 'Cancelamento com +24h';
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_percentage := 50;
    v_cancellation_reason := 'Cancelamento entre 12h e 24h';
  ELSE
    v_credit_percentage := 0;
    v_cancellation_reason := 'Cancelamento com -12h';
  END IF;

  v_credit_amount := (v_reserva.total_price * v_credit_percentage) / 100;

  -- 4. Update the reservation status.
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- 5. If credit is due, update aluno balance and log the transaction.
  IF v_credit_amount > 0 THEN
    UPDATE public.alunos
    SET credit_balance = credit_balance + v_credit_amount
    WHERE id = v_aluno.id;

    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', v_cancellation_reason, p_reserva_id);
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_my_reservation_and_get_credit(uuid) TO authenticated;
