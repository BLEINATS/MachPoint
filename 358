/*
# [Function] handle_client_cancellation_final
Corrige a função de cancelamento de reserva pelo cliente para garantir que o crédito seja calculado e aplicado corretamente ao saldo do cliente.
Esta função substitui a versão anterior que não estava creditando o valor devido ao cliente após o cancelamento.

## Query Description: [This function is a critical fix for the client booking cancellation flow. It ensures that when a client cancels a reservation, the system correctly calculates the refundable credit based on the cancellation policy (e.g., 24-hour rule), finds the client's specific profile for that arena, updates their credit balance, and logs the transaction. This prevents clients from losing credits they are entitled to.]

## Metadata:
- Schema-Category: ["Structural", "Data"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Tables affected: public.reservas (UPDATE), public.alunos (UPDATE), public.credit_transactions (INSERT)
- Functions affected: Replaces `public.handle_client_cancellation_final`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [MUST be called by an authenticated user. The function internally checks if the caller owns the reservation.]
*/
DROP FUNCTION IF EXISTS public.handle_client_cancellation_final(uuid);

CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva RECORD;
  v_aluno RECORD;
  v_hours_until_reservation INT;
  v_credit_to_refund NUMERIC := 0;
  v_cancellation_reason TEXT;
BEGIN
  -- 1. Fetch the reservation and ensure the caller is the owner
  SELECT * INTO v_reserva
  FROM public.reservas
  WHERE id = p_reserva_id AND profile_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva não encontrada ou você não tem permissão para cancelá-la.';
  END IF;

  -- 2. Check if it's already cancelled
  IF v_reserva.status = 'cancelada' THEN
    RAISE EXCEPTION 'Esta reserva já foi cancelada.';
  END IF;
  
  -- 3. Check if it's a valid type to be cancelled by a client (not internal blocks)
  IF v_reserva.type IN ('bloqueio', 'aula', 'evento', 'torneio') THEN
      RAISE EXCEPTION 'Este tipo de reserva não pode ser cancelado pelo cliente.';
  END IF;

  -- 4. Calculate hours until reservation
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  -- 5. Determine credit based on policy
  IF v_hours_until_reservation >= 24 THEN
    v_credit_to_refund := v_reserva.total_price;
    v_cancellation_reason := 'Cancelamento com +24h de antecedência';
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_to_refund := v_reserva.total_price * 0.5;
    v_cancellation_reason := 'Cancelamento entre 12h e 24h';
  ELSE
    v_credit_to_refund := 0;
    v_cancellation_reason := 'Cancelamento com -12h de antecedência';
  END IF;
  
  -- Ensure credit is not negative and not null
  v_credit_to_refund := COALESCE(GREATEST(0, v_credit_to_refund), 0);

  -- 6. Find the corresponding 'aluno' record for the specific arena
  SELECT * INTO v_aluno
  FROM public.alunos
  WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id
  LIMIT 1;

  -- 7. Apply credit if applicable and aluno profile exists
  IF v_credit_to_refund > 0 AND v_aluno IS NOT NULL THEN
    -- Update aluno's credit balance
    UPDATE public.alunos
    SET credit_balance = credit_balance + v_credit_to_refund
    WHERE id = v_aluno.id;

    -- Log the transaction
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno.id, v_reserva.arena_id, v_credit_to_refund, 'cancellation_credit', v_cancellation_reason, p_reserva_id);
  END IF;

  -- 8. Mark the reservation as cancelled
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_client_cancellation_final(uuid) TO authenticated;
