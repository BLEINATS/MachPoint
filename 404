/*
  # [Security Hardening] Set Search Path for Core Functions
  [This operation enhances the security of the 'add_credit_to_aluno' and 'handle_client_cancellation_final' functions by explicitly setting their search path. This prevents potential vulnerabilities related to search path hijacking, ensuring the functions only access objects within the intended 'public' schema.]

  ## Query Description: [This is a safe, non-destructive operation that only modifies the function's definition to improve security. It has no impact on existing data or application functionality.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Safe"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function: public.add_credit_to_aluno(uuid, uuid, numeric)
  - Function: public.handle_client_cancellation_final(uuid)
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [Not Applicable]
  
  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [None]
*/

CREATE OR REPLACE FUNCTION public.add_credit_to_aluno(
    aluno_id_to_update uuid,
    arena_id_to_check uuid,
    amount_to_add numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.alunos
    SET credit_balance = credit_balance + amount_to_add
    WHERE id = aluno_id_to_update AND arena_id = arena_id_to_check;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_client_cancellation_final(p_reserva_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reserva RECORD;
    v_aluno RECORD;
    v_credit_to_add NUMERIC := 0;
    v_hours_until_reservation INT;
    v_policy_text TEXT;
BEGIN
    -- Get reservation details
    SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id FOR UPDATE;

    -- Ensure reservation exists and is confirmed
    IF v_reserva IS NULL OR v_reserva.status != 'confirmada' THEN
        RAISE EXCEPTION 'Reserva não encontrada ou já cancelada.';
    END IF;

    -- Ensure it's a client reservation
    IF v_reserva.profile_id IS NULL THEN
        RAISE EXCEPTION 'Esta função é apenas para reservas de clientes.';
    END IF;

    -- Find the associated student/client profile
    SELECT * INTO v_aluno FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id;
    IF v_aluno IS NULL THEN
        RAISE EXCEPTION 'Perfil de cliente não encontrado para esta reserva.';
    END IF;

    -- Calculate hours until reservation
    v_hours_until_reservation := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - NOW())) / 3600;

    -- Apply cancellation policy
    IF v_hours_until_reservation >= 24 THEN
        v_credit_to_add := v_reserva.total_price;
        v_policy_text := 'Cancelamento com +24h';
    ELSIF v_hours_until_reservation >= 12 THEN
        v_credit_to_add := v_reserva.total_price * 0.5;
        v_policy_text := 'Cancelamento entre 12-24h';
    ELSE
        v_credit_to_add := 0;
        v_policy_text := 'Cancelamento com <12h';
    END IF;
    
    -- Update reservation status
    UPDATE public.reservas SET status = 'cancelada' WHERE id = p_reserva_id;

    -- Add credit if applicable
    IF v_credit_to_add > 0 THEN
        UPDATE public.alunos SET credit_balance = credit_balance + v_credit_to_add WHERE id = v_aluno.id;

        -- Log the credit transaction
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno.id, v_reserva.arena_id, v_credit_to_add, 'cancellation_credit', 'Crédito por cancelamento (' || v_policy_text || ')', p_reserva_id);
    END IF;

END;
$$;
