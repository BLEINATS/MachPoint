/*
# [Fix] Resolução de Conflito de Função Duplicada
Remove as versões conflitantes da função `create_client_reservation_atomic` e recria uma única versão definitiva para resolver a ambiguidade, garantindo a criação de reservas.

## Query Description: "Esta operação remove funções duplicadas e as recria. É uma operação segura que não afeta dados existentes, mas corrige um erro crítico na criação de reservas. Nenhum backup é necessário."

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Dropping function: public.create_client_reservation_atomic(p_arena_id uuid, p_quadra_id uuid, p_date date, p_start_time time, p_end_time time, p_total_price numeric, p_payment_status public.payment_status, p_sport_type text, p_credit_to_use numeric, p_rented_items jsonb, p_client_name text, p_client_phone text)
- Dropping function: public.create_client_reservation_atomic(p_arena_id uuid, p_quadra_id uuid, p_date date, p_start_time time, p_end_time time, p_total_price numeric, p_payment_status text, p_sport_type text, p_credit_to_use numeric, p_rented_items jsonb, p_client_name text, p_client_phone text)
- Creating function: public.ensure_aluno_profile_exists(...)
- Creating function: public.create_client_reservation_atomic(...)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: authenticated

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Nenhum impacto de performance esperado.
*/

-- Drop both potentially existing function signatures to resolve ambiguity
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, public.payment_status, text, numeric, jsonb, text, text);
DROP FUNCTION IF EXISTS public.create_client_reservation_atomic(uuid, uuid, date, time without time zone, time without time zone, numeric, text, text, numeric, jsonb, text, text);

-- Recreate the helper function to be safe
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
    -- Check if an aluno profile already exists for this user and arena
    SELECT id INTO v_aluno_id
    FROM public.alunos
    WHERE profile_id = p_profile_id AND arena_id = p_arena_id;

    -- If not, create one
    IF v_aluno_id IS NULL THEN
        INSERT INTO public.alunos (profile_id, arena_id, name, phone, status, plan_name, join_date)
        VALUES (p_profile_id, p_arena_id, p_client_name, p_client_phone, 'ativo', 'Avulso', CURRENT_DATE)
        RETURNING id INTO v_aluno_id;
    END IF;

    RETURN v_aluno_id;
END;
$$;


-- Recreate the definitive version of the main function
CREATE OR REPLACE FUNCTION public.create_client_reservation_atomic(
    p_arena_id uuid,
    p_quadra_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_total_price numeric,
    p_payment_status text, -- Using TEXT to match frontend
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
    v_reserva_id uuid;
BEGIN
    -- Ensure the aluno profile exists and get its ID
    v_aluno_id := public.ensure_aluno_profile_exists(v_profile_id, p_arena_id, p_client_name, p_client_phone);

    -- Insert the reservation
    INSERT INTO public.reservas (
        arena_id,
        quadra_id,
        profile_id,
        aluno_id,
        clientName,
        clientPhone,
        date,
        start_time,
        end_time,
        status,
        type,
        total_price,
        credit_used,
        payment_status,
        sport_type,
        rented_items
    )
    VALUES (
        p_arena_id,
        p_quadra_id,
        v_profile_id,
        v_aluno_id,
        p_client_name,
        p_client_phone,
        p_date,
        p_start_time,
        p_end_time,
        'confirmada',
        'avulsa',
        p_total_price,
        p_credit_to_use,
        p_payment_status::public.payment_status, -- Cast to enum here for data integrity
        p_sport_type,
        p_rented_items
    ) RETURNING id INTO v_reserva_id;

    -- Deduct credit if used
    IF p_credit_to_use > 0 THEN
        UPDATE public.alunos
        SET credit_balance = credit_balance - p_credit_to_use
        WHERE id = v_aluno_id;

        -- Log the credit transaction
        INSERT INTO public.credit_transactions (aluno_id, arena_id, amount, type, description, related_reservation_id)
        VALUES (v_aluno_id, p_arena_id, -p_credit_to_use, 'reservation_payment', 'Pagamento da reserva #' || substr(v_reserva_id::text, 1, 8), v_reserva_id);
    END IF;
END;
$$;
