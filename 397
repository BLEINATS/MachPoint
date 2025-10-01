/*
  # Operation Name: Secure Gamification and Cancellation Functions
  [This operation secures database functions by setting a fixed search_path, preventing potential security vulnerabilities.]

  ## Query Description: [This operation updates the 'add_gamification_points' and 'handle_client_cancellation_final' functions to include a fixed search_path. This is a security enhancement and does not change the core logic or impact existing data. It is a safe, reversible operation.]

  ## Metadata:
  - Schema-Category: ["Structural", "Safe"]
  - Impact-Level: ["Low"]
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Functions affected:
    - public.add_gamification_points(uuid, integer, text)
    - public.handle_client_cancellation_final(uuid)

  ## Security Implications:
  - RLS Status: [No Change]
  - Policy Changes: [No]
  - Auth Requirements: [No Change]

  ## Performance Impact:
  - Indexes: [No Change]
  - Triggers: [No Change]
  - Estimated Impact: [None]
*/

-- Secure add_gamification_points function
CREATE OR REPLACE FUNCTION public.add_gamification_points(
    p_aluno_id uuid,
    p_points_to_add integer,
    p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  SET search_path = public;
  INSERT INTO public.gamification_point_transactions (aluno_id, arena_id, points, type, description)
  SELECT
    p_aluno_id,
    a.arena_id,
    p_points_to_add,
    'manual_adjustment'::gamification_point_transaction_type,
    p_description
  FROM public.alunos a
  WHERE a.id = p_aluno_id;
END;
$$;

-- Secure handle_client_cancellation_final function
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reserva public.reservas;
  v_credit_to_refund numeric := 0;
  v_hours_until_reservation integer;
  v_aluno_id uuid;
BEGIN
  SET search_path = public;

  SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

  IF v_reserva IS NULL THEN
    RAISE EXCEPTION 'Reserva não encontrada.';
  END IF;

  IF v_reserva.status = 'cancelada' THEN
    RAISE EXCEPTION 'Esta reserva já foi cancelada.';
  END IF;

  v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

  IF v_hours_until_reservation >= 24 THEN
    v_credit_to_refund := v_reserva.total_price;
  ELSIF v_hours_until_reservation >= 12 THEN
    v_credit_to_refund := v_reserva.total_price * 0.5;
  ELSE
    v_credit_to_refund := 0;
  END IF;

  UPDATE public.reservas
  SET status = 'cancelada'
  WHERE id = p_reserva_id;

  IF v_credit_to_refund > 0 AND v_reserva.profile_id IS NOT NULL THEN
    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id LIMIT 1;
    
    IF v_aluno_id IS NOT NULL THEN
      PERFORM public.add_credit_to_aluno(v_aluno_id, v_reserva.arena_id, v_credit_to_refund);
      
      INSERT INTO public.credit_transactions(aluno_id, arena_id, amount, type, description, related_reservation_id)
      VALUES (v_aluno_id, v_reserva.arena_id, v_credit_to_refund, 'cancellation_credit', 'Crédito por cancelamento da reserva #' || substr(p_reserva_id::text, 1, 8), p_reserva_id);
    END IF;
  END IF;
END;
$$;
