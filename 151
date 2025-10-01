/*
          # [Structural] Fix Client Reservation Function
          [This operation drops and recreates the `create_client_reservation_atomic` function to fix the gamification logic and apply security best practices.]

          ## Query Description: [This operation replaces the existing `create_client_reservation_atomic` function with a corrected version. The new version fixes a bug in how gamification points were calculated and awarded upon reservation completion. It also sets a secure `search_path` to address a security warning. This is a safe operation that should resolve the reservation creation errors and improve system security.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Drops function: `create_client_reservation_atomic(uuid,uuid,text,text,text,numeric,text,text,integer,jsonb,text,text)`
          - Creates function: `create_client_reservation_atomic(uuid,uuid,text,text,text,numeric,text,text,integer,jsonb,text,text)`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Low. The function logic is slightly changed but performance should be similar.]
          */
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, text, text, text, numeric, text, text, integer, jsonb, text, text);

CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic (
  p_arena_id uuid,
  p_quadra_id uuid,
  p_date text,
  p_start_time text,
  p_end_time text,
  p_total_price numeric,
  p_payment_status text,
  p_sport_type text,
  p_credit_to_use integer,
  p_rented_items jsonb,
  p_client_name text,
  p_client_phone text
)
RETURNS void AS $$
DECLARE
  v_profile_id uuid := auth.uid();
  v_aluno_id uuid;
  v_new_reserva_id uuid;
  v_gamification_settings record;
  v_points_to_add integer;
BEGIN
  -- Ensure the user has an 'aluno' profile for this arena
  v_aluno_id := public.ensure_aluno_profile(v_profile_id, p_arena_id);

  -- Check for duplicate reservation
  IF EXISTS (
    SELECT 1
    FROM public.reservas
    WHERE quadra_id = p_quadra_id
      AND date = p_date
      AND start_time = p_start_time
      AND status <> 'cancelada'
  ) THEN
    RAISE EXCEPTION 'duplicate_reservation';
  END IF;

  -- Insert the new reservation
  INSERT INTO public.reservas (
    arena_id, quadra_id, profile_id, date, start_time, end_time, total_price, payment_status, sport_type,
    credit_used, rented_items, clientName, clientPhone, type, status, created_by_name
  )
  VALUES (
    p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, p_total_price, p_payment_status::public.payment_status_enum, p_sport_type,
    p_credit_to_use, p_rented_items, p_client_name, p_client_phone, 'avulsa', 'confirmada', p_client_name
  )
  RETURNING id INTO v_new_reserva_id;

  -- Apply credit if used
  IF p_credit_to_use > 0 THEN
    UPDATE public.alunos
    SET credit_balance = credit_balance - p_credit_to_use
    WHERE id = v_aluno_id;

    INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
    VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || v_new_reserva_id::text, v_new_reserva_id);
  END IF;

  -- Check if gamification is enabled and calculate points
  SELECT is_enabled, points_per_reservation, points_per_real INTO v_gamification_settings
  FROM public.gamification_settings
  WHERE arena_id = p_arena_id;

  -- Add gamification points if enabled
  IF v_gamification_settings.is_enabled THEN
    v_points_to_add := v_gamification_settings.points_per_reservation + floor(p_total_price * v_gamification_settings.points_per_real);
    
    IF v_points_to_add > 0 THEN
      PERFORM public.add_gamification_points(v_aluno_id, v_points_to_add, 'Pontos por reserva #' || v_new_reserva_id::text);
    END IF;
  END IF;

END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = 'public';
