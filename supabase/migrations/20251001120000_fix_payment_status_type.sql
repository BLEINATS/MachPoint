-- 1. Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,time without time zone,time without time zone,numeric,text,text,numeric,jsonb,text,text);
DROP FUNCTION IF EXISTS public.ensure_aluno_profile_exists(uuid, uuid, text, text);

-- 2. Recreate ensure_aluno_profile_exists function correctly
/*
# [Function] ensure_aluno_profile_exists
Cria um perfil de 'aluno' para um usuário (profile) em uma arena específica, se ainda não existir.
Isso garante que todo cliente que faz uma reserva tenha um registro na tabela 'alunos',
o que é essencial para gerenciar créditos e planos.
*/
CREATE OR REPLACE FUNCTION public.ensure_aluno_profile_exists(
    p_profile_id uuid,
    p_arena_id uuid,
    p_client_name text,
    p_client_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_exists boolean;
BEGIN
    -- Check if an 'aluno' profile already exists for this user in this arena
    SELECT EXISTS (
        SELECT 1
        FROM public.alunos
        WHERE profile_id = p_profile_id AND arena_id = p_arena_id
    ) INTO v_aluno_exists;
    -- If it doesn't exist, create one
    IF NOT v_aluno_exists THEN
        INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, plan_name, join_date)
        VALUES (p_profile_id, p_arena_id, p_client_name, p_client_phone, 'ativo', 'Avulso', CURRENT_DATE);
    END IF;
END;
$$;

-- 3. Recreate create_client_reservation_atomic function with correct type casting
/*
# [Function] create_client_reservation_atomic
Cria uma reserva de cliente de forma atômica. Esta versão corrige o erro de tipo no parâmetro 'payment_status',
aceitando texto e convertendo-o para o tipo 'payment_status' do banco de dados.
*/
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status text, -- Changed to TEXT
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
BEGIN
    -- Step 1: Ensure an 'aluno' profile exists for the authenticated user.
    PERFORM public.ensure_aluno_profile_exists(v_profile_id, p_arena_id, p_client_name, p_client_phone);
    -- Step 2: Get the corresponding 'aluno' ID for credit transactions.
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = v_profile_id AND arena_id = p_arena_id
    LIMIT 1;
    -- Step 3: Insert the reservation with the correct 'profile_id'.
    INSERT INTO public.reservas (
        arena_id,
        quadra_id,
        profile_id,
        date,
        start_time,
        end_time,
        status,
        type,
        total_price,
        payment_status, -- This column is of type payment_status
        sport_type,
        credit_used,
        rented_items,
        "clientName",
        "clientPhone"
    )
    VALUES (
        p_arena_id,
        p_quadra_id,
        v_profile_id,
        p_date,
        p_start_time,
        p_end_time,
        'confirmada',
        'avulsa',
        p_total_price,
        p_payment_status::public.payment_status, -- Cast TEXT to payment_status
        p_sport_type,
        p_credit_to_use,
        p_rented_items,
        p_client_name,
        p_client_phone
    );
    -- Step 4: If credit was used, deduct it from the aluno's balance.
    IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;
    END IF;
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION public.create_client_reservation_atomic(uuid,uuid,date,time,time,numeric,text,text,numeric,jsonb,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_aluno_profile_exists(uuid, uuid, text, text) TO authenticated;
