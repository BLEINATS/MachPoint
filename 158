/*
          # [SECURITY] Secure Database Functions (Part 3)
          This migration continues to address the 'Function Search Path Mutable' security advisory by setting a fixed `search_path` for more database functions. This prevents potential hijacking attacks by ensuring functions resolve objects from the expected schemas.

          ## Query Description: [This operation updates several database functions to improve security. It does not alter data or functionality but makes the system more robust against potential threats. No backup is required, and the change is easily reversible.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Functions being updated:
            - `handle_client_cancellation_final(uuid)`
            - `add_gamification_points(uuid, integer, text)`
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: Unchanged
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact. This is a security hardening measure.
          */

-- Secure the client cancellation function
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reserva public.reservas;
  v_aluno public.alunos;
  v_credit_to_add numeric := 0;
  v_hours_until_reservation integer;
BEGIN
  SET search_path = 'public';

  -- Fetch the reservation details
  SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

  IF v_reserva IS NULL THEN
    RAISE EXCEPTION 'Reserva com ID % não encontrada.', p_reserva_id;
  END IF;

  -- Fetch the associated student/client profile
  SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;

  IF v_aluno IS NULL THEN
    RAISE EXCEPTION 'Perfil de aluno não encontrado para a reserva.';
  END IF;

  -- Calculate hours until reservation
  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  -- Calculate credit based on cancellation policy
  IF v_hours_until_reservation >= 24 THEN
    v_credit_to_add := v_reserva.total_price;
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_to_add := v_reserva.total_price * 0.5;
  ELSE
    v_credit_to_add := 0;
  END IF;

  -- Update reservation status
  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  -- Add credit if applicable
  IF v_credit_to_add > 0 THEN
    PERFORM public.add_credit_to_aluno(v_aluno.id, v_reserva.arena_id, v_credit_to_add);
    
    -- Log the credit transaction
    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno.id, v_reserva.arena_id, v_credit_to_add, 'cancellation_credit', 'Crédito por cancelamento da reserva #' || substr(p_reserva_id::text, 1, 8), p_reserva_id);
  END IF;

  -- Insert notification for the client
  INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
  VALUES (v_reserva.profile_id, v_reserva.arena_id, 'Sua reserva para ' || to_char(v_reserva.date, 'DD/MM') || ' às ' || to_char(v_reserva.start_time, 'HH24:MI') || ' foi cancelada. Crédito de ' || v_credit_to_add::text || ' adicionado.', 'cancelamento');

  -- Insert notification for the admin
  INSERT INTO public.notificacoes (arena_id, message, type)
  VALUES (v_reserva.arena_id, 'A reserva de ' || v_reserva.clientName || ' para ' || to_char(v_reserva.date, 'DD/MM') || ' foi cancelada pelo cliente.', 'cancelamento');

END;
$$;

-- Secure the gamification points function
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_arena_id uuid;
    v_type gamification_point_transaction_type;
BEGIN
    SET search_path = 'public';

    -- Get arena_id from the aluno
    SELECT arena_id INTO v_arena_id FROM public.alunos WHERE id = p_aluno_id;

    IF v_arena_id IS NULL THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;

    -- Determine transaction type
    IF p_description ILIKE 'Resgate:%' THEN
        v_type := 'reward_redemption';
    ELSIF p_description ILIKE 'Conquista:%' THEN
        v_type := 'achievement_unlocked';
    ELSE
        v_type := 'manual_adjustment';
    END IF;

    -- Insert the point transaction
    INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description)
    VALUES (v_arena_id, p_aluno_id, p_points_to_add, v_type, p_description);

END;
$$;
