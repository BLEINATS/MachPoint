/*
          # [Function Security] Secure Client Cancellation Function
          [This operation secures the client cancellation function by setting a strict search_path.]

          ## Query Description: [This operation will recreate the `handle_client_cancellation_final` function to include `SET search_path = ''`. This is a security best practice to prevent hijacking attacks by ensuring the function only uses objects from schemas explicitly defined. It does not change the function's logic.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: `public.handle_client_cancellation_final(uuid)`
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [No]
          - Estimated Impact: [None. This is a security enhancement with no expected performance impact.]
          */

DROP FUNCTION IF EXISTS public.handle_client_cancellation_final(uuid);

CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reserva RECORD;
  v_aluno RECORD;
  v_arena RECORD;
  v_credit_amount NUMERIC := 0;
  v_policy_text TEXT;
  v_cancellation_reason TEXT;
  v_hours_until_reservation INT;
BEGIN
  -- Set a secure search_path
  SET search_path = '';

  -- Get reservation details
  SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

  -- Check if reservation exists
  IF v_reserva IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Reserva não encontrada.');
  END IF;

  -- Check if the user is authorized to cancel this reservation
  IF v_reserva.profile_id IS NULL OR v_reserva.profile_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Você não tem permissão para cancelar esta reserva.');
  END IF;

  -- Get arena details to fetch cancellation policy
  SELECT cancellation_policy INTO v_policy_text FROM public.arenas WHERE id = v_reserva.arena_id;

  -- Calculate hours until reservation
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  -- Cancellation logic
  IF v_hours_until_reservation >= 24 THEN
    v_credit_amount := v_reserva.total_price;
    v_cancellation_reason := 'Cancelamento com +24h de antecedência';
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_amount := v_reserva.total_price * 0.5;
    v_cancellation_reason := 'Cancelamento entre 12h e 24h';
  ELSE
    v_credit_amount := 0;
    v_cancellation_reason := 'Cancelamento com -12h de antecedência';
  END IF;

  -- Update reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- Add credit if applicable
  IF v_credit_amount > 0 THEN
    -- Find the corresponding 'aluno' profile
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;
    
    IF v_aluno IS NOT NULL THEN
      -- Add credit using the dedicated function
      PERFORM public.add_credit_to_aluno(v_aluno.id, v_reserva.arena_id, v_credit_amount);

      -- Log the credit transaction
      INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
      VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', v_cancellation_reason, p_reserva_id);
    ELSE
      -- Handle case where aluno profile is not found (should be rare)
      RETURN json_build_object('success', true, 'message', 'Reserva cancelada, mas o perfil de cliente não foi encontrado para aplicar o crédito.');
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Reserva cancelada com sucesso.', 'credit_added', v_credit_amount);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'message', 'Ocorreu um erro inesperado: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_client_cancellation_final(uuid) TO authenticated;
