/*
# [Fix] Corrigir `profile_id` nulo na criação de transação de crédito
Corrige um erro que ocorria durante o cancelamento de uma reserva por um cliente, onde a tentativa de registrar o crédito falhava devido a um `profile_id` nulo.

## Query Description: [Esta operação atualiza a função de cancelamento `cancel_reservation_and_get_credit` para usar o `profile_id` da reserva original ao invés do `profile_id` do registro do aluno. Isso garante que a transação de crédito seja sempre associada ao perfil de usuário correto, evitando violações de restrição `NOT NULL` e garantindo a consistência dos dados.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function `public.cancel_reservation_and_get_credit` (Recreated)

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Authenticated User]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Nenhum impacto de performance esperado. A alteração é em uma função que é executada sob demanda.]
*/

-- Drop a função antiga para garantir que a nova seja criada sem conflitos
DROP FUNCTION IF EXISTS public.cancel_reservation_and_get_credit(uuid);

-- Recria a função com a lógica corrigida
CREATE OR REPLACE FUNCTION public.cancel_reservation_and_get_credit(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva "reservas";
  v_arena_id uuid;
  v_credit_amount numeric;
  v_aluno "alunos";
BEGIN
  -- Get reservation details
  SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

  IF v_reserva IS NULL THEN
    RAISE EXCEPTION 'Reserva não encontrada.';
  END IF;

  v_arena_id := v_reserva.arena_id;

  -- Calculate credit amount based on cancellation policy
  IF (v_reserva.date + v_reserva.start_time) - now() > interval '24 hours' THEN
    v_credit_amount := v_reserva.total_price;
  ELSIF (v_reserva.date + v_reserva.start_time) - now() > interval '12 hours' THEN
    v_credit_amount := v_reserva.total_price * 0.5;
  ELSE
    v_credit_amount := 0;
  END IF;

  -- Update reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- Find the corresponding aluno record
  SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_arena_id;

  IF v_aluno IS NULL AND v_reserva.clientName IS NOT NULL THEN
    SELECT * INTO v_aluno FROM public.alunos WHERE name = v_reserva.clientName AND arena_id = v_arena_id LIMIT 1;
  END IF;

  -- If credit is due and aluno is found, process credit
  IF v_credit_amount > 0 AND v_aluno IS NOT NULL THEN
    -- Add credit to aluno's balance
    UPDATE public.alunos
    SET credit_balance = credit_balance + v_credit_amount
    WHERE id = v_aluno.id;

    -- Insert a record into credit_transactions using the reservation's profile_id
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id, profile_id)
    VALUES (v_aluno.id, v_arena_id, v_credit_amount, 'cancellation_credit', 'Crédito por cancelamento da reserva #' || substr(p_reserva_id::text, 1, 8), p_reserva_id, v_reserva.profile_id);
  END IF;
END;
$$;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_reservation_and_get_credit(uuid) TO authenticated;
