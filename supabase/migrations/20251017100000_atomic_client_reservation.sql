/*
          # [Function] create_client_reservation_atomic
          Cria ou substitui a função para criar uma reserva de cliente de forma atômica, incluindo todos os detalhes em uma única transação para evitar inconsistências de dados, como preço zerado.

          ## Query Description: "Esta operação substitui a função de criação de reserva do cliente por uma versão mais robusta e segura. A nova função garante que todos os dados da reserva, incluindo o preço, sejam salvos atomicamente, eliminando o risco de reservas com valor zerado. Não há impacto em dados existentes, apenas melhora a criação de novas reservas."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function: `public.create_client_reservation_atomic` (CREATE OR REPLACE)
          
          ## Security Implications:
          - RLS Status: A função opera com os privilégios do usuário autenticado (`invoker`), respeitando as políticas de RLS existentes.
          - Policy Changes: No
          - Auth Requirements: Requer um usuário autenticado (`authenticated` role).
          
          ## Performance Impact:
          - Indexes: N/A
          - Triggers: N/A
          - Estimated Impact: "Impacto de performance negligenciável. A mudança melhora a integridade dos dados ao consolidar múltiplas operações em uma única chamada de função."
          */

CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status public.payment_status,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
    v_new_reserva_id uuid;
BEGIN
    -- Garante que um perfil de aluno exista para o usuário nesta arena
    v_aluno_id := public.ensure_aluno_profile_exists();

    -- Deduz o crédito, se aplicável
    IF p_credit_to_use > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;
    END IF;

    -- Insere a reserva com todos os dados de uma vez
    INSERT INTO public.reservas (
        arena_id,
        quadra_id,
        profile_id,
        date,
        start_time,
        end_time,
        total_price,
        payment_status,
        sport_type,
        credit_used,
        rented_items,
        clientName,
        clientPhone,
        type,
        status
    )
    VALUES (
        p_arena_id,
        p_quadra_id,
        v_profile_id,
        p_date,
        p_start_time,
        p_end_time,
        p_total_price,
        p_payment_status,
        p_sport_type,
        p_credit_to_use,
        p_rented_items,
        p_client_name,
        p_client_phone,
        'avulsa', -- Tipo padrão para reservas de cliente
        'confirmada' -- Status padrão
    )
    RETURNING id INTO v_new_reserva_id;

    -- Registra a transação de crédito, se aplicável
    IF p_credit_to_use > 0 THEN
        INSERT INTO public.credit_transactions (
            aluno_id,
            arena_id,
            amount,
            type,
            description,
            related_reservation_id
        )
        VALUES (
            v_aluno_id,
            p_arena_id,
            -p_credit_to_use,
            'reservation_payment',
            'Pagamento da reserva #' || substr(v_new_reserva_id::text, 1, 8),
            v_new_reserva_id
        );
    END IF;

    RETURN v_new_reserva_id;
END;
$$;
