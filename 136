-- Remove a função que chama e a função que é chamada para evitar dependências
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, text, text, numeric, jsonb, text, text);

-- Remove quaisquer versões antigas da função auxiliar para garantir um estado limpo
DROP FUNCTION IF EXISTS public.ensure_aluno_profile_exists();
DROP FUNCTION IF EXISTS public.ensure_aluno_profile_exists(uuid, uuid, text, text);

/*
# [Function] ensure_aluno_profile_exists
Cria um perfil de aluno para um usuário (profile) em uma arena específica, se ainda não existir.
Esta função é "idempotente": se o perfil de aluno já existe para o usuário na arena, ela não faz nada.
Isso garante que todo cliente que faz uma reserva tenha um registro na tabela 'alunos',
o que é essencial para gerenciar créditos e histórico.

## Query Description:
- Operation: Inserts a new record into the `alunos` table.
- Safety: This is a safe operation. It uses `ON CONFLICT DO NOTHING` to prevent errors or duplicates if the record already exists. It will not overwrite or delete any data.
- Impact: A new `aluno` record might be created if one doesn't exist for the given user and arena.

## Metadata:
- Schema-Category: "Data"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (manually delete the created record)

## Structure Details:
- Table: public.alunos
- Columns affected: id, arena_id, profile_id, name, phone, status, plan_name, join_date

## Security Implications:
- RLS Status: Assumes RLS is enabled on `alunos`. A função é definida com SECURITY DEFINER para permitir a criação do perfil em nome do usuário.
- Policy Changes: No
- Auth Requirements: Must be called by an authenticated user.
*/
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile_exists(
    p_arena_id uuid,
    p_profile_id uuid,
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
    -- Tenta encontrar o aluno existente pelo profile_id
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

    -- Se não encontrar, cria um novo
    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (arena_id, profile_id, name, phone, status, plan_name, join_date)
        VALUES (p_arena_id, p_profile_id, p_client_name, p_client_phone, 'ativo', 'Avulso', CURRENT_DATE)
        ON CONFLICT (arena_id, profile_id) DO NOTHING
        RETURNING id INTO v_aluno_id;
        
        -- Se o insert com ON CONFLICT não retornou um ID (corrida de condição), tenta selecionar novamente
        IF v_aluno_id IS NULL THEN
            SELECT id INTO v_aluno_id
            FROM public.alunos
            WHERE profile_id = p_profile_id AND arena_id = p_arena_id;
        END IF;
    END IF;

    RETURN v_aluno_id;
END;
$$;


/*
# [Function] create_client_reservation_atomic
Recria a função para criar uma reserva de cliente de forma atômica, agora chamando a versão correta e definitiva de `ensure_aluno_profile_exists`.
Isso corrige o erro de "function does not exist" com a assinatura de 4 parâmetros.

## Query Description:
- Operation: Replaces the existing `create_client_reservation_atomic` function.
- Safety: This is a structural change to a function. It is safe as long as the logic is correct. It modifies how data is inserted but does not alter existing reservation data.
- Impact: Fixes the bug preventing clients from creating new reservations.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (revert to the previous function definition if available)

## Structure Details:
- Function: public.create_client_reservation_atomic

## Security Implications:
- RLS Status: The function runs with the invoker's rights (`SECURITY INVOKER`), respecting the user's RLS policies.
- Policy Changes: No
- Auth Requirements: Must be called by an authenticated user.
*/
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status text,
    p_sport_type text,
    p_credit_to_use numeric,
    p_rented_items jsonb,
    p_client_name text,
    p_client_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
    v_new_reserva_id uuid;
BEGIN
    -- 1. Garante que o perfil de aluno existe para o cliente e obtém o ID do aluno.
    v_aluno_id := public.ensure_aluno_profile_exists(p_arena_id, v_profile_id, p_client_name, p_client_phone);

    -- 2. Insere a reserva na tabela 'reservas'.
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
        p_payment_status::public.payment_status,
        p_sport_type,
        p_credit_to_use,
        p_rented_items,
        p_client_name,
        p_client_phone,
        'avulsa', -- Tipo padrão para reserva de cliente
        'confirmada' -- Status padrão
    )
    RETURNING id INTO v_new_reserva_id;

    -- 3. Se crédito foi usado, debita do saldo do aluno e registra a transação.
    IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
        -- Debita o crédito do perfil do aluno
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;

        -- Registra a transação de crédito
        INSERT INTO public.credit_transactions (
            aluno_id,
            arena_id,
            amount,
            type,
            description,
            related_reservation_id,
            created_by
        )
        VALUES (
            v_aluno_id,
            p_arena_id,
            -p_credit_to_use,
            'reservation_payment',
            'Pagamento da reserva #' || substr(v_new_reserva_id::text, 1, 8),
            v_new_reserva_id,
            v_profile_id
        );
    END IF;
END;
$$;
