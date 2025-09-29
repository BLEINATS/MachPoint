/*
# [Function Security Update]
Set a secure search_path for database functions.

## Query Description:
This operation updates two existing functions (`create_reservation_with_credit` and `cancel_reservation_for_client`) to explicitly set the `search_path`. This is a security best practice recommended by Supabase to prevent potential hijacking attacks by malicious users. It does not alter the function's logic or behavior.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies `public.create_reservation_with_credit` function.
- Modifies `public.cancel_reservation_for_client` function.

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates "Function Search Path Mutable" warning.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

-- Update function: create_reservation_with_credit
CREATE OR REPLACE FUNCTION public.create_reservation_with_credit(
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status public.payment_status_enum,
    p_sport_type text,
    p_client_name text,
    p_client_phone text,
    p_credit_to_use numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_aluno_id uuid;
    v_profile_id uuid;
    v_reserva_id uuid;
    v_arena_id uuid;
BEGIN
    -- Obter arena_id da quadra
    SELECT quadras.arena_id INTO v_arena_id FROM public.quadras WHERE id = p_quadra_id;

    -- Garantir que o perfil do aluno exista e obter o ID
    v_aluno_id := public.ensure_aluno_profile(auth.uid(), v_arena_id, p_client_name, p_client_phone);
    
    -- Obter o profile_id do aluno
    SELECT alunos.profile_id INTO v_profile_id FROM public.alunos WHERE id = v_aluno_id;

    -- Inserir a reserva
    INSERT INTO public.reservas (quadra_id, arena_id, profile_id, clientName, clientPhone, date, start_time, end_time, total_price, payment_status, sport_type, credit_used, type, status, created_by_name)
    VALUES (p_quadra_id, v_arena_id, v_profile_id, p_client_name, p_client_phone, p_date, p_start_time, p_end_time, p_total_price, p_payment_status, p_sport_type, p_credit_to_use, 'avulsa', 'confirmada', p_client_name)
    RETURNING id INTO v_reserva_id;

    -- Deduzir o crédito se houver
    IF p_credit_to_use > 0 THEN
        PERFORM public.add_credit_to_aluno(v_aluno_id, v_arena_id, -p_credit_to_use);
        
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, v_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_reserva_id::text, 1, 8), v_reserva_id);
    END IF;

    RETURN v_reserva_id;
END;
$$;

-- Update function: cancel_reservation_for_client
CREATE OR REPLACE FUNCTION public.cancel_reservation_for_client(
    p_reserva_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_reserva public.reservas;
    v_aluno_id uuid;
    v_credit_to_refund numeric := 0;
    v_hours_diff integer;
    v_policy_text text;
BEGIN
    -- Obter detalhes da reserva
    SELECT * INTO v_reserva FROM public.reservas WHERE id = p_reserva_id;

    -- Obter o aluno_id associado ao perfil
    SELECT id INTO v_aluno_id FROM public.alunos WHERE profile_id = v_reserva.profile_id AND arena_id = v_reserva.arena_id LIMIT 1;
    
    -- Se não encontrar aluno, não há como reembolsar crédito. Apenas cancela.
    IF v_aluno_id IS NULL THEN
        UPDATE public.reservas SET status = 'cancelada' WHERE id = p_reserva_id;
        RETURN;
    END IF;

    -- Calcular horas de antecedência
    v_hours_diff := EXTRACT(EPOCH FROM (v_reserva.date + v_reserva.start_time - now())) / 3600;

    -- Obter política de cancelamento da arena
    SELECT cancellation_policy INTO v_policy_text FROM public.arenas WHERE id = v_reserva.arena_id;

    -- Lógica de crédito
    IF v_hours_diff >= 24 THEN
        v_credit_to_refund := v_reserva.total_price;
    ELSIF v_hours_diff >= 12 THEN
        v_credit_to_refund := v_reserva.total_price * 0.5;
    ELSE
        v_credit_to_refund := 0;
    END IF;
    
    -- Reembolsar qualquer crédito que foi usado na reserva original
    IF v_reserva.credit_used > 0 THEN
        v_credit_to_refund := v_credit_to_refund + v_reserva.credit_used;
    END IF;

    -- Atualizar status da reserva
    UPDATE public.reservas SET status = 'cancelada' WHERE id = p_reserva_id;

    -- Adicionar crédito ao aluno, se aplicável
    IF v_credit_to_refund > 0 THEN
        PERFORM public.add_credit_to_aluno(v_aluno_id, v_reserva.arena_id, v_credit_to_refund);
        
        -- Registrar transação de crédito
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, v_reserva.arena_id, v_credit_to_refund, 'cancellation_credit', 'Crédito por cancelamento da reserva #' || substr(v_reserva.id::text, 1, 8), v_reserva.id);
    END IF;

END;
$$;
