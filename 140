/*
          # [Security] Definir Search Path para Função de Reserva
          [Este script atualiza a função `create_client_reservation_atomic` para definir um `search_path` explícito, resolvendo um dos avisos de segurança "Function Search Path Mutable" e aumentando a segurança da operação.]

          ## Query Description: [Esta operação recria a função de criação de reservas, adicionando `SET search_path = public` à sua definição. Isso garante que a função sempre execute no contexto do schema `public`, prevenindo potenciais ataques de sequestro de caminho de busca. A lógica da função permanece inalterada, e a operação é segura e não afeta dados existentes.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Altera a função `public.create_client_reservation_atomic`.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [No]
          - Triggers: [No]
          - Estimated Impact: [Nenhum impacto de performance esperado.]
          */

CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_total_price numeric,
    p_payment_status public.payment_status_enum,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
    v_gamification_is_enabled boolean;
    v_points_for_reservation int;
BEGIN
    -- Etapa 1: Garantir que o perfil de aluno exista e obter o ID
    v_aluno_id := public.ensure_aluno_profile(
        p_profile_id := v_profile_id,
        p_arena_id := p_arena_id,
        p_name := p_client_name,
        p_phone := p_client_phone
    );

    -- Etapa 2: Inserir a reserva
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time, total_price, 
        payment_status, sport_type, clientName, clientPhone, type, status, 
        credit_used, rented_items, created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, p_total_price,
        p_payment_status, p_sport_type, p_client_name, p_client_phone, 'avulsa', 'confirmada',
        p_credit_to_use, p_rented_items, p_client_name
    );

    -- Etapa 3: Deduzir créditos, se aplicável
    IF p_credit_to_use > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;

        INSERT INTO public.credit_transactions (arena_id, aluno_id, amount, type, description)
        VALUES (p_arena_id, v_aluno_id, -p_credit_to_use, 'reservation_payment', 'Pagamento de reserva');
    END IF;

    -- Etapa 4: Adicionar pontos de gamificação se o sistema estiver ativo
    SELECT is_enabled, points_per_reservation 
    INTO v_gamification_is_enabled, v_points_for_reservation
    FROM public.gamification_settings
    WHERE arena_id = p_arena_id;

    IF v_gamification_is_enabled AND v_points_for_reservation > 0 THEN
        PERFORM public.add_gamification_points(
            p_aluno_id := v_aluno_id,
            p_points_to_add := v_points_for_reservation,
            p_description := 'Pontos por nova reserva'
        );
    END IF;

EXCEPTION
    WHEN others THEN
        RAISE;
END;
$$;
