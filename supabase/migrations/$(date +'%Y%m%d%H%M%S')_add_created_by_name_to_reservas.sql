-- Adiciona a coluna created_by_name à tabela de reservas, se ela ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'reservas'
        AND column_name = 'created_by_name'
    ) THEN
        ALTER TABLE public.reservas ADD COLUMN created_by_name text;
    END IF;
END
$$;

-- Remove versões antigas das funções para garantir um estado limpo
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,time,time,numeric,text,text,numeric,jsonb,text,text);
DROP FUNCTION IF EXISTS public.create_admin_reservation(uuid,uuid,date,time,time,numeric,text,text,numeric,jsonb,text,text,public.reservation_type,text);

-- Recria a função de reserva do cliente para salvar o nome do criador
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid := auth.uid();
    v_aluno_id uuid;
    v_creator_name text;
BEGIN
    -- Obtém o nome do usuário que está criando a reserva
    SELECT name INTO v_creator_name FROM public.profiles WHERE id = v_profile_id;

    -- Garante que um perfil de 'aluno' exista para o usuário autenticado
    PERFORM public.ensure_aluno_profile_exists(v_profile_id, p_arena_id, p_client_name, p_client_phone);

    -- Obtém o ID do 'aluno' para transações de crédito
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = v_profile_id AND arena_id = p_arena_id
    LIMIT 1;

    -- Insere a reserva com o nome do criador
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time, status, type,
        total_price, payment_status, sport_type, credit_used, rented_items,
        "clientName", "clientPhone", created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, 'confirmada', 'avulsa',
        p_total_price, p_payment_status::public.payment_status, p_sport_type, p_credit_to_use, p_rented_items,
        p_client_name, p_client_phone, v_creator_name
    );

    -- Deduz o crédito, se utilizado
    IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;
    END IF;
END;
$$;

-- Recria a função de reserva do administrador para salvar o nome do criador
CREATE OR REPLACE FUNCTION public.create_admin_reservation(
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
    p_client_phone text,
    p_type public.reservation_type,
    p_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_profile_id uuid := auth.uid();
    v_admin_name text;
    v_aluno_id uuid;
    v_profile_id uuid;
BEGIN
    -- Obtém o nome do administrador
    SELECT name INTO v_admin_name FROM public.profiles WHERE id = v_admin_profile_id;

    -- Encontra ou cria o perfil de 'aluno' para o cliente
    SELECT id, profile_id INTO v_aluno_id, v_profile_id
    FROM public.alunos
    WHERE name = p_client_name AND arena_id = p_arena_id
    LIMIT 1;

    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (arena_id, name, phone, status, plan_name, join_date)
        VALUES (p_arena_id, p_client_name, p_client_phone, 'ativo', 'Avulso', CURRENT_DATE)
        RETURNING id, profile_id INTO v_aluno_id, v_profile_id;
    END IF;

    -- Insere a reserva com o nome do administrador como criador
    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time, status, type,
        total_price, payment_status, sport_type, credit_used, rented_items,
        "clientName", "clientPhone", created_by_name, notes
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, 'confirmada', p_type,
        p_total_price, p_payment_status::public.payment_status, p_sport_type, p_credit_to_use, p_rented_items,
        p_client_name, p_client_phone, v_admin_name, p_notes
    );
    
    -- Deduz o crédito, se utilizado
    IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;
    END IF;
END;
$$;

-- Concede permissões de execução para as funções
GRANT EXECUTE ON FUNCTION public.create_client_reservation_atomic(uuid,uuid,date,time,time,numeric,text,text,numeric,jsonb,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_reservation(uuid,uuid,date,time,time,numeric,text,text,numeric,jsonb,text,text,public.reservation_type,text) TO authenticated;
