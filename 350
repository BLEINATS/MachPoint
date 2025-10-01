/*
# [FIX] Corrigir Conflitos de Funções de Reserva de Cliente
[Este script remove todas as versões conflitantes das funções `create_client_reservation_atomic` e `ensure_aluno_profile_exists` e as recria com a estrutura correta e definitiva para resolver os erros de migração e execução.]

## Query Description: [Esta operação irá apagar e recriar funções essenciais para a reserva de clientes. Não há risco de perda de dados de reservas existentes, mas é uma alteração estrutural importante. Recomenda-se fazer um backup por precaução.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Funções Afetadas:
  - `public.create_client_reservation_atomic`
  - `public.ensure_aluno_profile_exists`

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [N/A]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Baixo. A recriação das funções pode causar um bloqueio momentâneo mínimo, mas não deve impactar a performance geral.]
*/

-- PASSO 1: Remover todas as versões conflitantes das funções para garantir um estado limpo.
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, public.payment_status, text, numeric, jsonb, text, text);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, text, text, numeric, jsonb, text, text);
DROP FUNCTION IF EXISTS public.ensure_aluno_profile_exists(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.ensure_aluno_profile_exists();

-- PASSO 2: Criar a função auxiliar definitiva para garantir o perfil de aluno.
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile_exists(
    p_profile_id uuid,
    p_arena_id uuid,
    p_client_name text,
    p_client_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_id uuid;
BEGIN
    -- Verifica se já existe um perfil de aluno para este usuário nesta arena
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

    -- Se não existir, cria um novo perfil de aluno "Avulso"
    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, plan_name, join_date)
        VALUES (p_profile_id, p_arena_id, p_client_name, p_client_phone, 'ativo', 'Avulso', CURRENT_DATE)
        RETURNING id INTO v_aluno_id;
    END IF;

    RETURN v_aluno_id;
END;
$$;

-- PASSO 3: Criar a função principal e definitiva para a criação de reserva pelo cliente.
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_total_price numeric,
    p_payment_status text, -- Usar TEXT para evitar problemas de tipo enum
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
    v_final_payment_status public.payment_status;
BEGIN
    -- Garante que o perfil de aluno existe e obtém o ID
    v_aluno_id := public.ensure_aluno_profile_exists(v_profile_id, p_arena_id, p_client_name, p_client_phone);

    -- Converte o status de pagamento de texto para o tipo enum
    v_final_payment_status := p_payment_status::public.payment_status;

    -- Insere a reserva
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
        v_final_payment_status,
        p_sport_type,
        p_credit_to_use,
        p_rented_items,
        p_client_name,
        p_client_phone,
        'avulsa', -- Tipo padrão para reserva de cliente
        'confirmada' -- Status padrão
    );

    -- Se crédito foi usado, atualiza o saldo do aluno
    IF p_credit_to_use > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;
    END IF;

END;
$$;

-- Conceder permissão para o role `authenticated` chamar as funções
GRANT EXECUTE ON FUNCTION public.ensure_aluno_profile_exists(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, text, text, numeric, jsonb, text, text) TO authenticated;
