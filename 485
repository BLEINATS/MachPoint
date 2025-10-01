/*
# [SECURITY] Set Search Path for handle_client_cancellation_final
[Description of what this operation does] This migration secures the `handle_client_cancellation_final` function by setting a fixed, empty `search_path`.

## Query Description: [This operation enhances security by preventing potential hijacking of function calls within the `handle_client_cancellation_final` function. It redefines the function to explicitly set its search path, which is a recommended security practice. There is no impact on existing data, and the function's behavior remains unchanged.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.handle_client_cancellation_final(uuid)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [None]
*/

DROP FUNCTION IF EXISTS public.handle_client_cancellation_final(uuid);

CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_reserva RECORD;
  v_aluno RECORD;
  v_credit_amount NUMERIC;
  v_hours_until_reservation INT;
  v_cancellation_reason TEXT;
  v_original_price NUMERIC;
BEGIN
  -- 1. Fetch the reservation details securely
  SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

  IF v_reserva IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Reserva não encontrada.');
  END IF;

  -- 2. Check if the user is authorized (either the one who booked or an arena admin)
  IF NOT (
    v_reserva.profile_id = auth.uid() OR
    public.is_arena_admin(v_reserva.arena_id)
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Você não tem permissão para cancelar esta reserva.');
  END IF;

  -- 3. Calculate cancellation policy
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - NOW())) / 3600;
  v_original_price := COALESCE(v_reserva.total_price, 0);

  IF v_hours_until_reservation >= 24 THEN
    v_credit_amount := v_original_price;
    v_cancellation_reason := 'Cancelamento com +24h';
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_amount := v_original_price * 0.5;
    v_cancellation_reason := 'Cancelamento entre 12h e 24h';
  ELSE
    v_credit_amount := 0;
    v_cancellation_reason := 'Cancelamento com -12h';
  END IF;

  -- 4. Update the reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- 5. Handle credit if applicable
  IF v_credit_amount > 0 AND v_reserva.profile_id IS NOT NULL THEN
    -- Find the corresponding 'aluno' profile to add credit
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;

    IF v_aluno IS NOT NULL THEN
      -- Add credit to the aluno's balance
      UPDATE public.alunos
      SET credit_balance = credit_balance + v_credit_amount
      WHERE id = v_aluno.id;

      -- Log the credit transaction
      INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
      VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', v_cancellation_reason, p_reserva_id);
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Reserva cancelada com sucesso.', 'credit_refunded', v_credit_amount);
END;
$function$;
