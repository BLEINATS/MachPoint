-- Adiciona a coluna para rastrear quem criou a reserva
ALTER TABLE public.reservas
ADD COLUMN created_by_name TEXT;

-- Atualiza a função de criação de reserva do cliente
-- para incluir o nome de quem está criando
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid,uuid,date,time,time,numeric,text,text,numeric,jsonb,text,text);
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
    p_client_phone text,
    p_created_by_name text -- Novo parâmetro
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
    PERFORM public.ensure_aluno_profile_exists(v_profile_id, p_arena_id, p_client_name, p_client_phone);

    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = v_profile_id AND arena_id = p_arena_id
    LIMIT 1;

    INSERT INTO public.reservas (
        arena_id, quadra_id, profile_id, date, start_time, end_time, status, type, total_price, payment_status, sport_type, credit_used, rented_items, "clientName", "clientPhone", created_by_name
    )
    VALUES (
        p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, 'confirmada', 'avulsa', p_total_price, p_payment_status::payment_status, p_sport_type, p_credit_to_use, p_rented_items, p_client_name, p_client_phone, p_created_by_name
    );

    IF p_credit_to_use > 0 AND v_aluno_id IS NOT NULL THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;
    END IF;
END;
$$;

-- Cria uma função para criação de reserva pelo admin, também rastreando quem criou
CREATE OR REPLACE FUNCTION public.create_admin_reservation(
    p_reserva_id uuid,
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_client_name text,
    p_client_phone text,
    p_type text,
    p_status text,
    p_total_price numeric,
    p_payment_status text,
    p_credit_used numeric,
    p_sport_type text,
    p_notes text,
    p_rented_items jsonb,
    p_is_recurring boolean,
    p_recurring_type text,
    p_recurring_end_date date,
    p_created_by_name text -- Novo parâmetro
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aluno_id uuid;
    v_profile_id uuid;
BEGIN
    -- Tenta encontrar o aluno/cliente existente. Se não encontrar, cria um.
    SELECT id, profile_id INTO v_aluno_id, v_profile_id
    FROM public.alunos
    WHERE name = p_client_name AND arena_id = p_arena_id
    LIMIT 1;

    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (arena_id, name, phone, status, plan_name, join_date)
        VALUES (p_arena_id, p_client_name, p_client_phone, 'ativo', 'Avulso', CURRENT_DATE)
        RETURNING id, profile_id INTO v_aluno_id, v_profile_id;
    END IF;

    -- Upsert da reserva
    INSERT INTO public.reservas (
        id, arena_id, quadra_id, profile_id, date, start_time, end_time, "clientName", "clientPhone", type, status, total_price, payment_status, credit_used, sport_type, notes, rented_items, "isRecurring", "recurringType", "recurringEndDate", created_by_name
    ) VALUES (
        COALESCE(p_reserva_id, gen_random_uuid()), p_arena_id, p_quadra_id, v_profile_id, p_date, p_start_time, p_end_time, p_client_name, p_client_phone, p_type::reservation_type, p_status::reservation_status, p_total_price, p_payment_status::payment_status, p_credit_used, p_sport_type, p_notes, p_rented_items, p_is_recurring, p_recurring_type::recurring_type, p_recurring_end_date, p_created_by_name
    )
    ON CONFLICT (id) DO UPDATE SET
        quadra_id = EXCLUDED.quadra_id,
        date = EXCLUDED.date,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        "clientName" = EXCLUDED."clientName",
        "clientPhone" = EXCLUDED."clientPhone",
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        total_price = EXCLUDED.total_price,
        payment_status = EXCLUDED.payment_status,
        credit_used = EXCLUDED.credit_used,
        sport_type = EXCLUDED.sport_type,
        notes = EXCLUDED.notes,
        rented_items = EXCLUDED.rented_items,
        "isRecurring" = EXCLUDED."isRecurring",
        "recurringType" = EXCLUDED."recurringType",
        "recurringEndDate" = EXCLUDED."recurringEndDate",
        updated_at = NOW();
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_client_reservation_atomic(uuid,uuid,date,time,time,numeric,text,text,numeric,jsonb,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_reservation(uuid,uuid,uuid,date,time,time,text,text,text,text,numeric,text,numeric,text,text,jsonb,boolean,text,date,text) TO authenticated;
