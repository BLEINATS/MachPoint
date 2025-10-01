/*
          # [SECURITY] Secure Core Functions
          This migration enhances the security of key functions related to cancellations and gamification by setting a fixed search_path.

          ## Query Description: [This operation updates existing database functions to improve security. It sets a fixed search_path to prevent potential SQL injection vectors. No data will be changed, and functionality should remain identical.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Modifies function: `handle_client_cancellation_final(uuid)`
          - Modifies function: `add_gamification_points(uuid, integer, text)`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [No Change]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */

CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reserva RECORD;
  v_aluno RECORD;
  v_credit_amount NUMERIC := 0;
  v_hours_until_reservation INT;
  v_policy_text TEXT;
BEGIN
  -- Get reservation details
  SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

  IF v_reserva IS NULL THEN
    RAISE EXCEPTION 'Reserva com ID % não encontrada.', p_reserva_id;
  END IF;

  -- Find the associated student profile
  SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id LIMIT 1;

  IF v_aluno IS NULL THEN
    RAISE EXCEPTION 'Perfil de aluno não encontrado para esta reserva.';
  END IF;

  -- Calculate hours until reservation
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - NOW())) / 3600;

  -- Determine credit amount based on policy
  IF v_hours_until_reservation >= 24 THEN
    v_credit_amount := v_reserva.total_price;
    v_policy_text := 'Cancelamento com +24h';
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_amount := v_reserva.total_price * 0.5;
    v_policy_text := 'Cancelamento entre 12h-24h';
  ELSE
    v_credit_amount := 0;
    v_policy_text := 'Cancelamento com -12h';
  END IF;

  -- Update reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- Add credit if applicable
  IF v_credit_amount > 0 THEN
    -- Add credit to the student's balance
    UPDATE public.alunos
    SET credit_balance = credit_balance + v_credit_amount
    WHERE id = v_aluno.id;

    -- Log the credit transaction
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno.id, v_reserva.arena_id, v_credit_amount, 'cancellation_credit', 'Crédito (' || v_policy_text || ') da reserva #' || SUBSTRING(v_reserva.id::text, 1, 8), v_reserva.id);
  END IF;

  -- Create notification for the client
  INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
  VALUES (v_reserva.profile_id, v_reserva.arena_id, 'Sua reserva para ' || TO_CHAR(v_reserva.date, 'DD/MM') || ' às ' || v_reserva.start_time || ' foi cancelada. Crédito de ' || v_credit_amount::text || ' aplicado.', 'cancelamento');

  -- Create notification for the admin
  INSERT INTO public.notificacoes (arena_id, message, type)
  VALUES (v_reserva.arena_id, 'Reserva de ' || v_reserva.clientName || ' para ' || TO_CHAR(v_reserva.date, 'DD/MM') || ' foi cancelada pelo cliente.', 'cancelamento');

END;
$$;


CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aluno RECORD;
BEGIN
  SELECT id, arena_id INTO v_aluno FROM public.alunos WHERE id = p_aluno_id;

  IF v_aluno IS NULL THEN
    RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
  END IF;

  INSERT INTO public.gamification_point_transactions (arena_id, aluno_id, points, type, description)
  VALUES (v_aluno.arena_id, p_aluno_id, p_points_to_add, 'manual_adjustment', p_description);
END;
$$;
