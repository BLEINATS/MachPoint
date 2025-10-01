/*
  # [SECURITY] Secure Functions with search_path

  [This migration enhances security by explicitly setting the `search_path` for several functions, mitigating potential risks associated with mutable search paths. It also refactors the client cancellation logic for better consistency and security.]

  ## Query Description: [This operation modifies existing database functions to improve security. It ensures that functions run with a predictable schema search path, preventing potential hijacking attacks. No data is altered, mas the behavior of the functions is made more secure.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [false] -- Reverting would require re-applying the old function definitions.
  
  ## Structure Details:
  - Functions being modified:
    - `handle_client_cancellation_final(uuid)`
    - `add_gamification_points(uuid, integer, text)`
  
  ## Security Implications:
  - RLS Status: [Unaffected]
  - Policy Changes: [No]
  - Auth Requirements: [Unaffected]
  - `search_path` is set to `public` for all modified functions to prevent security vulnerabilities.
  
  ## Performance Impact:
  - Indexes: [Unaffected]
  - Triggers: [Unaffected]
  - Estimated Impact: [Negligible performance impact. The changes are primarily for security hardening.]
*/

-- Function 1: handle_client_cancellation_final
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_reserva public.reservas;
    v_aluno public.alunos;
    v_hours_until_reservation INT;
    v_credit_to_add NUMERIC := 0;
    v_credit_percentage INT := 0;
    v_cancellation_reason TEXT;
BEGIN
    -- 1. Fetch the reservation and lock it for update
    SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id FOR UPDATE;

    -- 2. Check if reservation exists and is cancellable
    IF v_reserva IS NULL THEN
        RAISE EXCEPTION 'Reserva com ID % não encontrada.', p_reserva_id;
    END IF;

    IF v_reserva.status = 'cancelada' THEN
        RAISE EXCEPTION 'Esta reserva já foi cancelada.';
    END IF;

    -- 3. Fetch the associated student/client profile
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;
    
    IF v_aluno IS NULL THEN
        RAISE EXCEPTION 'Perfil de aluno/cliente não encontrado para esta reserva.';
    END IF;

    -- 4. Calculate hours until reservation
    v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - NOW())) / 3600;

    -- 5. Determine credit based on cancellation policy
    IF v_hours_until_reservation >= 24 THEN
        v_credit_percentage := 100;
        v_cancellation_reason := 'Cancelamento (+24h)';
    ELSIF v_hours_until_reservation >= 12 THEN
        v_credit_percentage := 50;
        v_cancellation_reason := 'Cancelamento (12-24h)';
    ELSE
        v_credit_percentage := 0;
        v_cancellation_reason := 'Cancelamento (-12h)';
    END IF;

    v_credit_to_add := (v_reserva.total_price * v_credit_percentage) / 100.0;

    -- 6. Update reservation status
    UPDATE public.reservas
    SET status = 'cancelada',
        updated_at = NOW()
    WHERE id = p_reserva_id;

    -- 7. Add credit if applicable
    IF v_credit_to_add > 0 THEN
        -- Call the add_credit_to_aluno function
        PERFORM public.add_credit_to_aluno(v_aluno.id, v_reserva.arena_id, v_credit_to_add);
        
        -- Log the credit transaction
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno.id, v_reserva.arena_id, v_credit_to_add, 'cancellation_credit', v_cancellation_reason, p_reserva_id);
    END IF;

    -- 8. Create notification for the client
    INSERT INTO public.notificacoes (profile_id, arena_id, message, type)
    VALUES (
        v_reserva.profile_id,
        v_reserva.arena_id,
        'Sua reserva para ' || TO_CHAR(v_reserva.date, 'DD/MM') || ' às ' || v_reserva.start_time || ' foi cancelada. ' ||
        CASE 
            WHEN v_credit_to_add > 0 THEN 'Um crédito de ' || v_credit_to_add::TEXT || ' foi adicionado à sua conta.'
            ELSE ''
        END,
        'cancelamento'
    );
END;
$$;

-- Function 2: add_gamification_points
CREATE OR REPLACE FUNCTION public.add_gamification_points(p_aluno_id uuid, p_points_to_add integer, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_aluno public.alunos;
BEGIN
    -- Fetch aluno to get arena_id
    SELECT * INTO v_aluno FROM public.alunos WHERE id = p_aluno_id;

    IF v_aluno IS NULL THEN
        RAISE EXCEPTION 'Aluno com ID % não encontrado.', p_aluno_id;
    END IF;

    -- Insert the transaction
    INSERT INTO public.gamification_point_transactions(arena_id, aluno_id, points, type, description)
    VALUES (v_aluno.arena_id, p_aluno_id, p_points_to_add, 'manual_adjustment', p_description);
END;
$$;
