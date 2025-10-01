/*
# [Fix] Corrigir a chamada da função de verificação de duplicidade

Esta migração corrige a função `create_client_reservation_atomic` para chamar corretamente a função `check_duplicate_reservation`, passando todos os parâmetros necessários e evitando o erro "function does not exist".

## Query Description: [Esta operação substitui uma função existente no banco de dados para corrigir um erro interno. Não há impacto direto nos dados existentes. A correção garante que novas reservas de clientes possam ser criadas sem erro.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Modifies function: `public.create_client_reservation_atomic`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Nenhum impacto de performance esperado.]
*/

CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time character varying,
    p_end_time character varying,
    p_total_price numeric,
    p_payment_status public.payment_status_enum,
    p_sport_type character varying,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name character varying,
    p_client_phone character varying
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
    v_reserva_id uuid;
    v_gamification_settings record;
    v_points_to_add integer := 0;
BEGIN
    -- 1. Garantir que o perfil de aluno existe para este usuário/arena
    v_aluno_id := ensure_aluno_profile(v_profile_id, p_arena_id);

    -- 2. Verificar se há conflito de horário
    -- CORREÇÃO: Adicionado o quinto parâmetro como NULL para corresponder à assinatura da função.
    IF check_duplicate_reservation(p_quadra_id, p_date, p_start_time::time, p_end_time::time, NULL) THEN
        RAISE EXCEPTION 'Horário indisponível. Já existe uma reserva neste período.';
    END IF;

    -- 3. Inserir a nova reserva
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time, total_price,
        payment_status, sport_type, credit_used, rented_items, client_name, client_phone,
        type, status, created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, p_total_price,
        p_payment_status, p_sport_type, p_credit_to_use, p_rented_items, p_client_name, p_client_phone,
        'avulsa', 'confirmada', p_client_name
    )
    RETURNING id INTO v_reserva_id;

    -- 4. Debitar crédito, se usado
    IF p_credit_to_use > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;

        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_reserva_id::text, 1, 8), v_reserva_id);
    END IF;

    -- 5. Adicionar pontos de gamificação
    SELECT is_enabled, points_per_reservation, points_per_real
    INTO v_gamification_settings
    FROM public.gamification_settings
    WHERE arena_id = p_arena_id;

    IF FOUND AND v_gamification_settings.is_enabled THEN
        v_points_to_add := v_gamification_settings.points_per_reservation + floor(p_total_price * v_gamification_settings.points_per_real);
        
        IF v_points_to_add > 0 THEN
            PERFORM add_gamification_points(
                v_aluno_id,
                v_points_to_add,
                'Pontos por nova reserva',
                'reservation_completed',
                v_reserva_id,
                v_profile_id
            );
        END IF;
    END IF;

    RETURN v_reserva_id;
END;
$$;
